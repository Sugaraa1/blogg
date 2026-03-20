import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ChatWindow from './ChatWindow';
import ChatList from './ChatList';
import './Chat.css';

function Chat({ currentUser, onlineUsers = [] }) {
  const socketRef = useRef(null);
  const [showChat, setShowChat] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 🆕 Avatar URL helper function
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:image')) return avatar; // Base64
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${avatar}`;
  };

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}');
    }
    const socket = socketRef.current;

    if (currentUser?.id) {
      socket.emit('user_connected', currentUser.id);
    }

    socket.on('receive_message', (data) => {
      if (selectedUser?.id === data.sender) {
        const markAsRead = async () => {
          try {
            const token = localStorage.getItem('token');
            await axios.put(
              `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/${data._id}/read`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        };
        markAsRead();
      }
      fetchConversations();
    });

    socket.on('user_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.sender]: true
      }));
    });

    socket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.sender]: false
      }));
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      const unread = response.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/search?q=', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = response.data.filter(u => u._id !== currentUser.id);
      setAllUsers(filtered);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Хэрэглэгч ачаалахад алдаа гарлаа');
    }
  };

  const handleStartNewMessage = (user) => {
    setSelectedUser({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar
    });
    setShowNewMessage(false);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleClose = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  return (
    <div className="chat-container">
      {!showChat && (
        <button className="chat-toggle-btn" onClick={() => setShowChat(true)}>
          <span className="chat-icon">💬</span>
          {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
        </button>
      )}

      {showChat && (
        <div className="chat-window-wrapper">
          <div className="chat-header">
            <h3>Мессеж</h3>
            <div className="chat-header-buttons">
              {!selectedUser && (
                <button 
                  className="new-message-btn" 
                  onClick={() => {
                    setShowNewMessage(true);
                    fetchAllUsers();
                  }}
                  title="Шинэ мессеж"
                >
                  ✎
                </button>
              )}
              <button className="close-btn" onClick={handleClose}>✕</button>
            </div>
          </div>

          {!selectedUser ? (
            <ChatList 
              conversations={conversations}
              onSelectUser={handleSelectUser}
              onlineUsers={onlineUsers}
            />
          ) : (
            <ChatWindow
              selectedUser={selectedUser}
              currentUser={currentUser}
              onBack={handleBackToList}
              socket={socketRef.current}
              isTyping={typingUsers[selectedUser.id] || false}
              onMessagesUpdate={fetchConversations}
            />
          )}

          {showNewMessage && (
            <div className="new-message-modal">
              <div className="new-message-content">
                <div className="new-message-header">
                  <h4>Шинэ мессеж</h4>
                  <button 
                    className="close-btn" 
                    onClick={() => setShowNewMessage(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <input
                  type="text"
                  placeholder="Хэрэглэгч хайх..."
                  className="user-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <div className="user-list">
                  {allUsers
                    .filter(u => 
                      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(user => (
                      <div 
                        key={user._id} 
                        className="user-item"
                        onClick={() => handleStartNewMessage(user)}
                      >
                        {/* 🆕 ЗАСВАРЛАСАН Avatar */}
                        {getAvatarUrl(user.avatar) ? (
                          <img 
                            src={getAvatarUrl(user.avatar)}
                            alt={user.username}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="user-info">
                          <h5>{user.displayName || user.username}</h5>
                          <p>@{user.username}</p>
                        </div>
                      </div>
                    ))
                  }
                  {allUsers.filter(u => 
                    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="no-users">
                      <p>Хэрэглэгч олдсонгүй</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;