import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const MessageContextMenu = ({ contextMenu, onHide, onAction }) => {
  const { user } = useAuth();

  if (!contextMenu.visible || !contextMenu.message) return null;

  const { message } = contextMenu;
  const isOwnMessage = message.senderId === user.id;

  const handleAction = (action) => {
    onAction(action, message);
    onHide();
  };

  const menuStyle = {
    position: 'fixed',
    top: contextMenu.y,
    left: contextMenu.x,
    zIndex: 1000,
    background: 'white',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '0.5rem 0',
    minWidth: '180px'
  };

  const menuItemStyle = {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontSize: '0.9rem',
    color: '#333',
    transition: 'background-color 0.2s'
  };

  const menuItemHoverStyle = {
    backgroundColor: '#f8f9fa'
  };

  return (
    <div 
      className="context-menu-backdrop" 
      onClick={onHide}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999
      }}
    >
      <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
        {/* Reply Options */}
        <button 
          style={menuItemStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => handleAction('reply')}
        >
          💬 Reply
        </button>
        
        <button 
          style={menuItemStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => handleAction('replyPrivately')}
        >
          🔒 Reply Privately
        </button>

        {/* Star Message */}
        <button 
          style={menuItemStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => handleAction('star')}
        >
          {message.starredBy?.includes(user.id) ? '⭐ Unstar' : '⭐ Star'}
        </button>

        {/* Copy & Forward */}
        <button 
          style={menuItemStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => handleAction('copy')}
        >
          📋 Copy Text
        </button>
        
        <button 
          style={menuItemStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          onClick={() => handleAction('forward')}
        >
          ↗️ Forward
        </button>

        {/* Owner-only options */}
        {isOwnMessage && (
          <>
            <button 
              style={menuItemStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => handleAction('edit')}
            >
              ✏️ Edit
            </button>
            
            <button 
              style={menuItemStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => handleAction('delete')}
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageContextMenu;