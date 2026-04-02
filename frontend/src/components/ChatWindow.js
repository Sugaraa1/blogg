import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './Chat.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ChatWindow({ selectedUser, currentUser, onBack, socket, isTyping, onMessagesUpdate }) {
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:image')) return avatar;
    return `${API_URL}${avatar}`;
  };

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const markAsRead = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/messages/${selectedUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
      setLoading(false);

      // Unread мессежүүдийг уншсан болгох
      const unreadMessages = response.data.filter(
        msg => {
          const receiverId = msg.receiver?._id || msg.receiver;
          return String(receiverId) === String(currentUser.id) && !msg.read;
        }
      );
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => markAsRead(msg._id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  }, [selectedUser.id, currentUser.id, markAsRead]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { sender: currentUser.id, receiver: selectedUser.id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { sender: currentUser.id, receiver: selectedUser.id });
      }, 3000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !image) return;

    try {
      const token = localStorage.getItem('token');
      let imageUrl = null;

      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadResponse = await axios.post(
          `${API_URL}/api/upload`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        imageUrl = uploadResponse.data.path;
      }

      const response = await axios.post(
        `${API_URL}/api/messages`,
        { receiver: selectedUser.id, content: messageInput.trim(), image: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('send_message', { ...response.data, _id: response.data._id });
      }

      setMessages(prev => [...prev, response.data]);
      setMessageInput('');
      setImage(null);
      setImagePreview(null);
      onMessagesUpdate();

      if (socket) {
        socket.emit('stop_typing', { sender: currentUser.id, receiver: selectedUser.id });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send message';
      alert(`Мессеж илгээхэд алдаа: ${errorMsg}`);
    }
  };

  // Мессежийн sender ID-г normalize хийх
  const getSenderId = (msg) => {
    if (msg.sender && typeof msg.sender === 'object') return String(msg.sender._id);
    return String(msg.sender);
  };

  const isSentByMe = (msg) => getSenderId(msg) === String(currentUser.id);

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-window-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <div className="header-avatar">
            {getAvatarUrl(selectedUser.avatar) ? (
              <img src={getAvatarUrl(selectedUser.avatar)} alt={selectedUser.username} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
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
          <div className="loading">Ачаалж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="header-avatar">
          {getAvatarUrl(selectedUser.avatar) ? (
            <img src={getAvatarUrl(selectedUser.avatar)} alt={selectedUser.username} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              {selectedUser.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="chat-window-info">
          <h4>{selectedUser.displayName || selectedUser.username}</h4>
          <span className="chat-handle">@{selectedUser.username}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages"><p>Хэлэлцээ эхлүүлэх</p></div>
        ) : (
          messages.map(msg => {
            const sent = isSentByMe(msg);
            const senderObj = typeof msg.sender === 'object' ? msg.sender : null;
            const senderAvatar = sent
              ? getAvatarUrl(currentUser.avatar)
              : getAvatarUrl(senderObj?.avatar);
            const senderInitial = sent
              ? (currentUser.displayName?.charAt(0).toUpperCase() || 'U')
              : (senderObj?.displayName?.charAt(0).toUpperCase() || 'U');

            return (
              <div key={msg._id} className={`message ${sent ? 'sent' : 'received'}`}>
                {/* Received: зүүн талд avatar */}
                {!sent && (
                  senderAvatar ? (
                    <img src={senderAvatar} alt="avatar" className="message-avatar" />
                  ) : (
                    <div className="message-avatar" style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      {senderInitial}
                    </div>
                  )
                )}

                <div className="message-content">
                  {msg.image && (
                    <img
                      src={msg.image.startsWith('http') ? msg.image : `${API_URL}${msg.image}`}
                      alt="Message"
                      className="message-image"
                    />
                  )}
                  {msg.content && <p>{msg.content}</p>}
                </div>

                {/* Sent: баруун талд avatar */}
                {sent && (
                  senderAvatar ? (
                    <img src={senderAvatar} alt="avatar" className="message-avatar" />
                  ) : (
                    <div className="message-avatar" style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      {senderInitial}
                    </div>
                  )
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="message received">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button type="button" className="remove-image-btn" onClick={() => { setImage(null); setImagePreview(null); }}>✕</button>
          </div>
        )}
        <div className="chat-input-container">
          <label className="image-upload-btn">
            📎
            <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
          </label>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => { setMessageInput(e.target.value); handleTyping(); }}
            placeholder="Мессеж илгээх..."
            className="chat-input"
          />
          <button type="submit" className="send-btn" disabled={!messageInput.trim() && !image}>
            📤
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;