import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { socket } from '../socket/socket.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useMessageContextMenu } from '../hooks/useMessageContextMenu.js';
import MessageContextMenu from './MessageContextMenu.jsx';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { showNotification } = useNotifications();
  const { contextMenu, showContextMenu, hideContextMenu } = useMessageContextMenu();

  useEffect(() => {
    // Socket event listeners
    socket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('messagesHistory', (messagesHistory) => {
      setMessages(messagesHistory);
    });

    socket.on('userTyping', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, data];
      });
    });

    socket.on('userStopTyping', (userId) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('messageUpdated', (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    });

    socket.on('messageDeleted', (data) => {
      if (typeof data === 'string') {
        // Handle old format
        setMessages(prev => prev.filter(msg => msg.id !== data));
      } else {
        // Handle new format with messageId
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    });

    socket.on('messageStarred', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, starredBy: data.starredBy }
          : msg
      ));
    });

    socket.on('privateMessage', (message) => {
      // Handle private messages
      if (message.senderId !== user.id) {
        showNotification(`Private message from ${message.senderName}`, {
          body: message.content,
          icon: '/message.png'
        });
      }
      // Add to a separate private messages state or show in a modal
      console.log('Private message received:', message);
    });

    // Join global room and get messages
    socket.emit('joinRoom', 'global');

    return () => {
      socket.off('message');
      socket.off('messagesHistory');
      socket.off('userTyping');
      socket.off('userStopTyping');
      socket.off('onlineUsers');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('messageStarred');
    };
  }, [showNotification]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContextMenuAction = async (action, message) => {
    switch (action) {
      case 'reply':
        setReplyingTo(message);
        setEditingMessage(null);
        break;
        
      case 'replyPrivately':
        // Set up private reply
        const privateReplyContent = prompt(`Send private reply to ${message.senderName}:`);
        if (privateReplyContent && privateReplyContent.trim()) {
          socket.emit('sendPrivateReply', {
            content: privateReplyContent.trim(),
            receiverId: message.senderId,
            repliedTo: message.id
          });
          showNotification(`Private reply sent to ${message.senderName}`);
        }
        break;
        
      case 'star':
        socket.emit('starMessage', { messageId: message.id });
        break;
        
      case 'copy':
        try {
          await navigator.clipboard.writeText(message.content);
          showNotification('Message copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy:', error);
          showNotification('Failed to copy message');
        }
        break;
        
      case 'forward':
        // Enhanced forward functionality
        const forwardTo = prompt('Forward message to (enter username):');
        if (forwardTo && forwardTo.trim()) {
          // Find user from online users
          const targetUser = onlineUsers.find(u => u.username.toLowerCase() === forwardTo.toLowerCase());
          if (targetUser) {
            socket.emit('sendPrivateReply', {
              content: `Forwarded: ${message.content}`,
              receiverId: targetUser.userId
            });
            showNotification(`Message forwarded to ${targetUser.username}`);
          } else {
            showNotification('User not found or not online');
          }
        }
        break;
        
      case 'edit':
        if (message.senderId === user.id) {
          setEditingMessage(message);
          setNewMessage(message.content);
          setReplyingTo(null);
        } else {
          showNotification('You can only edit your own messages');
        }
        break;
        
      case 'delete':
        if (message.senderId === user.id) {
          if (window.confirm('Are you sure you want to delete this message?')) {
            socket.emit('deleteMessage', { messageId: message.id });
          }
        } else {
          showNotification('You can only delete your own messages');
        }
        break;
        
      default:
        break;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageData = {
        content: newMessage,
        room: 'global'
      };

      if (replyingTo) {
        messageData.repliedTo = replyingTo.id;
        messageData.messageType = 'reply';
      }

      if (editingMessage) {
        socket.emit('editMessage', {
          messageId: editingMessage.id,
          content: newMessage
        });
        setEditingMessage(null);
      } else {
        socket.emit('sendMessage', messageData);
      }

      setNewMessage('');
      setReplyingTo(null);
      socket.emit('stopTyping');
      setIsTyping(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      socket.emit('typing');
      setIsTyping(true);
    }

    if (window.typingTimeout) {
      clearTimeout(window.typingTimeout);
    }

    window.typingTimeout = setTimeout(() => {
      socket.emit('stopTyping');
      setIsTyping(false);
    }, 1000);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setEditingMessage(null);
    setNewMessage('');
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageDate.toLocaleDateString() + ' ' + 
             messageDate.toLocaleTimeString([], { 
               hour: '2-digit', 
               minute: '2-digit' 
             });
    }
  };

  const renderReplyPreview = (repliedToData) => {
    // Handle both cases: repliedTo as ID (old format) or as object (new format)
    let repliedMessage;
    
    if (typeof repliedToData === 'string') {
      // repliedTo is just an ID, find the message in the messages array
      repliedMessage = messages.find(msg => msg.id === repliedToData);
    } else if (repliedToData && typeof repliedToData === 'object') {
      // repliedTo is the full object sent from server
      repliedMessage = repliedToData;
    }
    
    if (!repliedMessage) return null;

    return (
      <div className="reply-preview" onClick={() => scrollToMessage(repliedMessage.id)}>
        <div className="reply-line"></div>
        <div className="reply-content-wrapper">
          <div className="reply-sender">
            <span className="reply-icon">↪</span>
            {repliedMessage.senderName}
          </div>
          <div className="reply-content">
            {repliedMessage.content.length > 100 
              ? repliedMessage.content.substring(0, 100) + "..." 
              : repliedMessage.content
            }
          </div>
        </div>
      </div>
    );
  };

  // Function to scroll to and highlight a specific message
  const scrollToMessage = (messageId) => {
    // Handle both string ID and object with id property
    const targetId = typeof messageId === 'object' ? messageId.id : messageId;
    
    const messageElement = document.querySelector(`[data-message-id="${targetId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlighted-message');
      setTimeout(() => {
        messageElement.classList.remove('highlighted-message');
      }, 3000); // Remove highlight after 3 seconds
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Global Chat</h2>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="chat-layout">
        <div className="online-users">
          <h3>Online Users ({onlineUsers.length})</h3>
          <ul>
            {onlineUsers.map(onlineUser => (
              <li key={onlineUser.userId} className="online-user">
                <span className="status-dot"></span>
                {onlineUser.username}
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-main">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">💬</div>
                <h3>Welcome to the Chat!</h3>
                <p>Start a conversation by sending a message below.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div 
                key={index} 
                data-message-id={message.id}
                className={`message ${message.senderId === user.id ? 'own-message' : 'other-message'} ${
                  replyingTo?.id === message.id ? 'replying-to-this' : ''
                }`}
                onContextMenu={(e) => showContextMenu(e, message)}
              >
                {/* Star indicator */}
                {message.starredBy?.includes(user.id) && (
                  <div className="star-indicator">⭐</div>
                )}
                
                <div className="message-header">
                  <strong className="sender-name">{message.senderName}</strong>
                  <span className="message-time">
                    {formatMessageTime(message.timestamp)}
                    {message.isEdited && ' (edited)'}
                  </span>
                </div>

                {/* Reply preview - shows which message this is replying to */}
                {message.repliedTo && renderReplyPreview(message.repliedTo)}
                
                <div className="message-content">
                  {message.content}
                </div>

                {/* Reply indicator - shows if this message is being replied to */}
                {replyingTo?.id === message.id && (
                  <div className="reply-indicator">
                    <span className="reply-arrow">↪</span>
                    <span className="reply-text">Replying to this message</span>
                  </div>
                )}
              </div>
            ))}
            
            {typingUsers.map(typingUser => (
              <div key={typingUser.userId} className="typing-indicator">
                <em>{typingUser.username} is typing...</em>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply/Edit Preview */}
          {(replyingTo || editingMessage) && (
            <div className="action-preview">
              <div className="action-preview-content">
                <div className="action-header">
                  <span className="action-type">
                    {editingMessage ? (
                      <>
                        <span className="edit-icon">✏️</span>
                        Editing message
                      </>
                    ) : (
                      <>
                        <span className="reply-icon">↪</span>
                        Replying to {replyingTo?.senderName}
                      </>
                    )}
                  </span>
                  <button className="cancel-action" onClick={cancelReply}>✕</button>
                </div>
                {replyingTo && (
                  <div className="preview-message">
                    <div className="preview-sender">{replyingTo.senderName}</div>
                    <div className="preview-content">
                      {replyingTo.content.length > 120 
                        ? replyingTo.content.substring(0, 120) + "..." 
                        : replyingTo.content
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={
                editingMessage 
                  ? "Edit your message..." 
                  : replyingTo 
                    ? `Reply to ${replyingTo.senderName}...` 
                    : "Type a message..."
              }
            />
            <button type="submit">
              {editingMessage ? 'Update' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      <MessageContextMenu
        contextMenu={contextMenu}
        onHide={hideContextMenu}
        onAction={handleContextMenuAction}
      />
    </div>
  );
};

export default ChatRoom;