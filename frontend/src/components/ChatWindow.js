import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

function ChatWindow({ selectedUser, currentUser, onBack, socket, isTyping, onMessagesUpdate }) {
  // ✅ Avatar URL helper - BASE64 болон http link-ийг зөв боловсруулах
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:image')) return avatar; // Base64
    return `http://localhost:5000${avatar}`;
  };

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/messages/${selectedUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
      setLoading(false);

      // Mark messages as read and update conversation list
      const unreadMessages = response.data.filter(
        msg => msg.receiver._id === currentUser.id && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => {
          markAsRead(msg._id);
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        sender: currentUser.id,
        receiver: selectedUser.id
      });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          sender: currentUser.id,
          receiver: selectedUser.id
        });
      }, 3000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !image) return;

    try {
      const token = localStorage.getItem('token');
      let imageUrl = null;

      // Upload image if selected
      if (image) {
        const formData = new FormData();
        formData.append('file', image);

        const uploadResponse = await axios.post(
          'http://localhost:5000/api/upload',
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        imageUrl = uploadResponse.data.path;
      }

      const response = await axios.post(
        'http://localhost:5000/api/messages',
        {
          receiver: selectedUser.id,
          content: messageInput.trim(),
          image: imageUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Send via socket to recipient
      if (socket) {
        socket.emit('send_message', {
          ...response.data,
          _id: response.data._id
        });
      }

      setMessages([...messages, response.data]);
      setMessageInput('');
      setImage(null);
      setImagePreview(null);
      onMessagesUpdate();

      // Stop typing indicator
      if (socket) {
        socket.emit('stop_typing', {
          sender: currentUser.id,
          receiver: selectedUser.id
        });
      }
    } catch (error) {
      console.error('Error sending message:', error.response || error.message);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send message';
      alert(`Мессеж илгээхэд алдаа: ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <div className="chat-messages">
        <div className="loading">Ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button className="back-btn" onClick={onBack}>←</button>
        {/* ✅ ЗАСВАРЛАСАН - Avatar харуулах */}
        <div className="header-avatar">
          {getAvatarUrl(selectedUser.avatar) ? (
            <img 
              src={getAvatarUrl(selectedUser.avatar)} 
              alt={selectedUser.username}
            />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {selectedUser.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="chat-window-info">
          <h4>{selectedUser.displayName || selectedUser.username}</h4>
          <span className="chat-handle">@{selectedUser.username}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Хэлэлцээ эхлүүлэх</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg._id}
              className={`message ${msg.sender._id === currentUser.id ? 'sent' : 'received'}`}
            >
              {/* ✅ ЗАСВАРЛАСАН - Received message avatar */}
              {msg.sender._id !== currentUser.id && (
                getAvatarUrl(msg.sender.avatar) ? (
                  <img
                    src={getAvatarUrl(msg.sender.avatar)}
                    alt={msg.sender.username}
                    className="message-avatar"
                  />
                ) : (
                  <div className="message-avatar" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {msg.sender.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )
              )}
              
              <div className="message-content">
                {msg.image && (
                  <img src={`http://localhost:5000${msg.image}`} alt="Message" className="message-image" />
                )}
                {msg.content && <p>{msg.content}</p>}
              </div>
              
              {/* ✅ ЗАСВАРЛАСАН - Sent message avatar */}
              {msg.sender._id === currentUser.id && (
                getAvatarUrl(currentUser.avatar) ? (
                  <img
                    src={getAvatarUrl(currentUser.avatar)}
                    alt={currentUser.username}
                    className="message-avatar"
                  />
                ) : (
                  <div className="message-avatar" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )
              )}
            </div>
          ))
        )}
        {isTyping && (
          <div className="message typing-indicator">
            <span>●</span><span>●</span><span>●</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="chat-input-container">
          <label className="image-upload-btn">
            📎
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="Мессеж илгээх..."
            className="chat-input"
          />
          <button type="submit" className="send-btn">
            📤
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;