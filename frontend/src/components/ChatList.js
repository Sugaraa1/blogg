import React from 'react';

function ChatList({ conversations, onSelectUser, onlineUsers = [] }) {
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:5000${avatar}`;
  };

  const formatTime = (date) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'сейчас';
      if (diffMins < 60) return `${diffMins}м`;
      if (diffHours < 24) return `${diffHours}ч`;
      if (diffDays < 7) return `${diffDays}д`;
      
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const truncateText = (text, length = 30) => {
    if (!text) return 'No message';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div className="chat-list">
      {conversations.length === 0 ? (
        <div className="empty-conversations">
          <p>Хэлэлцээ байхгүй</p>
        </div>
      ) : (
        conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => onSelectUser(conv)}
          >
            <div className="conversation-avatar">
              {getAvatarUrl(conv.avatar) ? (
                <img src={getAvatarUrl(conv.avatar)} alt={conv.username} />
              ) : (
                <div className="avatar-placeholder">
                  {conv.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {onlineUsers?.includes(conv.id) && <div className="online-indicator" />}
            </div>

            <div className="conversation-info">
              <div className="conversation-header">
                <h4 className="conversation-name">{conv.displayName || conv.username}</h4>
                <span className="conversation-time">{formatTime(conv.lastMessageTime)}</span>
              </div>
              <p className="conversation-preview">{truncateText(conv.lastMessage)}</p>
            </div>

            {conv.unreadCount > 0 && (
              <div className="unread-badge">{conv.unreadCount}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ChatList;
