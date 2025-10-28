import Message from '../models/Message.js';
import User from '../models/user.js';

const connectedUsers = new Map();

const chatHandlers = (io, socket) => {
  // User joins the chat
  socket.on('joinRoom', async (room) => {
    try {
      socket.join(room);
      socket.room = room;

      // Add user to connected users
      if (socket.userId) {
        connectedUsers.set(socket.userId, {
          userId: socket.userId,
          username: socket.username,
          socketId: socket.id
        });

        // Update user online status
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: true,
          lastSeen: new Date()
        });

        // Send online users to all clients
        io.emit('onlineUsers', Array.from(connectedUsers.values()));
      }

      // Send message history for the room
      const messages = await Message.find({ 
        room,
        isDeleted: { $ne: true }
      })
        .populate([
          { path: 'sender', select: 'username' },
          { path: 'repliedTo', populate: { path: 'sender', select: 'username' } }
        ])
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit('messagesHistory', messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        senderName: msg.sender.username,
        senderId: msg.sender._id,
        timestamp: msg.createdAt,
        room: msg.room,
        messageType: msg.messageType || 'text',
        repliedTo: msg.repliedTo ? {
          id: msg.repliedTo._id,
          content: msg.repliedTo.content,
          senderName: msg.repliedTo.sender.username
        } : null,
        starredBy: msg.starredBy || [],
        isEdited: msg.isEdited || false,
        editedAt: msg.editedAt
      })));
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      if (!data.content || !data.content.trim()) {
        return socket.emit('error', 'Message content cannot be empty');
      }

      const messageData = {
        sender: socket.userId,
        content: data.content.trim(),
        room: data.room || 'global',
        receiver: data.receiver,
        messageType: data.messageType || 'text'
      };

      // Handle reply to message
      if (data.repliedTo) {
        messageData.repliedTo = data.repliedTo;
        messageData.messageType = 'reply';
      }

      const message = new Message(messageData);
      await message.save();
      await message.populate([
        { path: 'sender', select: 'username' },
        { path: 'repliedTo', populate: { path: 'sender', select: 'username' } }
      ]);

      const responseData = {
        id: message._id,
        content: message.content,
        senderName: message.sender.username,
        senderId: message.sender._id,
        timestamp: message.createdAt,
        room: message.room,
        messageType: message.messageType,
        repliedTo: message.repliedTo ? {
          id: message.repliedTo._id,
          content: message.repliedTo.content,
          senderName: message.repliedTo.sender.username
        } : null,
        starredBy: message.starredBy || [],
        isEdited: message.isEdited || false,
        editedAt: message.editedAt
      };

      if (data.receiver) {
        // Private message
        const receiverSocket = findUserSocket(data.receiver);
        if (receiverSocket) {
          io.to(receiverSocket).emit('privateMessage', responseData);
        }
        socket.emit('privateMessage', responseData);
      } else {
        // Room message
        io.to(data.room || 'global').emit('message', responseData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Typing indicators
  socket.on('typing', () => {
    if (socket.room && socket.userId && socket.username) {
      socket.to(socket.room).emit('userTyping', {
        userId: socket.userId,
        username: socket.username
      });
    }
  });

  socket.on('stopTyping', () => {
    if (socket.room && socket.userId) {
      socket.to(socket.room).emit('userStopTyping', socket.userId);
    }
  });

  // Star message
  socket.on('starMessage', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      if (!message) {
        return socket.emit('error', 'Message not found');
      }

      const userId = socket.userId;
      const isStarred = message.starredBy.includes(userId);

      if (isStarred) {
        // Unstar
        message.starredBy = message.starredBy.filter(id => id.toString() !== userId.toString());
      } else {
        // Star
        message.starredBy.push(userId);
      }

      await message.save();

      io.to(socket.room).emit('messageStarred', {
        messageId: message._id,
        starredBy: message.starredBy,
        isStarred: !isStarred
      });
    } catch (error) {
      console.error('Error starring message:', error);
      socket.emit('error', 'Failed to star message');
    }
  });

  // Handle private reply
  socket.on('sendPrivateReply', async (data) => {
    try {
      if (!data.content || !data.content.trim()) {
        return socket.emit('error', 'Message content cannot be empty');
      }

      const message = new Message({
        sender: socket.userId,
        content: data.content.trim(),
        receiver: data.receiverId,
        messageType: 'private',
        repliedTo: data.repliedTo
      });

      await message.save();
      await message.populate([
        { path: 'sender', select: 'username' },
        { path: 'receiver', select: 'username' },
        { path: 'repliedTo', populate: { path: 'sender', select: 'username' } }
      ]);

      const messageData = {
        id: message._id,
        content: message.content,
        senderName: message.sender.username,
        senderId: message.sender._id,
        receiverName: message.receiver.username,
        receiverId: message.receiver._id,
        timestamp: message.createdAt,
        messageType: message.messageType,
        repliedTo: message.repliedTo ? {
          id: message.repliedTo._id,
          content: message.repliedTo.content,
          senderName: message.repliedTo.sender.username
        } : null,
        starredBy: message.starredBy || []
      };

      // Send to receiver
      const receiverSocket = findUserSocket(data.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('privateMessage', messageData);
      }

      // Send to sender
      socket.emit('privateMessage', messageData);
    } catch (error) {
      console.error('Error sending private reply:', error);
      socket.emit('error', 'Failed to send private reply');
    }
  });

  // Edit message
  socket.on('editMessage', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      
      if (!message || message.sender.toString() !== socket.userId.toString()) {
        return socket.emit('error', 'Cannot edit this message');
      }

      if (!data.content || !data.content.trim()) {
        return socket.emit('error', 'Message content cannot be empty');
      }

      message.content = data.content.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      await message.populate([
        { path: 'sender', select: 'username' },
        { path: 'repliedTo', populate: { path: 'sender', select: 'username' } }
      ]);

      const messageData = {
        id: message._id,
        content: message.content,
        senderName: message.sender.username,
        senderId: message.sender._id,
        timestamp: message.createdAt,
        room: message.room,
        messageType: message.messageType || 'text',
        repliedTo: message.repliedTo ? {
          id: message.repliedTo._id,
          content: message.repliedTo.content,
          senderName: message.repliedTo.sender.username
        } : null,
        starredBy: message.starredBy || [],
        isEdited: message.isEdited,
        editedAt: message.editedAt
      };

      io.to(socket.room).emit('messageUpdated', messageData);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', 'Failed to edit message');
    }
  });

  // Delete message
  socket.on('deleteMessage', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      
      if (!message || message.sender.toString() !== socket.userId.toString()) {
        return socket.emit('error', 'Cannot delete this message');
      }

      // Soft delete
      message.isDeleted = true;
      await message.save();

      io.to(socket.room).emit('messageDeleted', {
        messageId: message._id,
        deletedBy: socket.userId,
        deletedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', 'Failed to delete message');
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);

        // Update user offline status
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: new Date()
        });

        // Emit updated online users list
        io.emit('onlineUsers', Array.from(connectedUsers.values()));
        
        // Stop typing indicator for disconnected user
        if (socket.room) {
          socket.to(socket.room).emit('userStopTyping', socket.userId);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};

// Helper function to find user socket ID
const findUserSocket = (userId) => {
  const user = connectedUsers.get(userId);
  return user ? user.socketId : null;
};

export { chatHandlers, connectedUsers };