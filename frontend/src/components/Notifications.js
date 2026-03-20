import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './Notifications.css';

function Notifications({ user, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Мэдэгдл татахад алдаа:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Мэдэгдлийг шинэчлэхэд алдаа:', error);
    }
  };

  const handleNotificationClick = async (notif, e) => {
    // Prevent navigation if clicking on links
    if (e.target.tagName === 'A') return;
    
    // Mark as read
    await markAsRead(notif._id);
    
    // Navigate based on notification type
    if (notif.type === 'follow') {
      navigate(`/profile/${notif.actor?.username}`);
    } else if (notif.type === 'like' || notif.type === 'comment' || notif.type === 'retweet') {
      // Navigate directly to the post
      navigate(`/post/${notif.post?._id}`);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      follow: '👤',
      like: '❤️',
      comment: '💬',
      retweet: '🔄',
      post: '📝'
    };
    return icons[type] || '🔔';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Дөнгөж сая';
    if (diffMins < 60) return `${diffMins}м`;
    if (diffHours < 24) return `${diffHours}ц`;
    if (diffDays < 7) return `${diffDays}ө`;
    return date.toLocaleDateString('mn-MN');
  };

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Мэдэгдэл</h2>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>🔔 Мэдэгдэл байхгүй байна</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={(e) => handleNotificationClick(notif, e)}
              >
                <Link 
                  to={`/profile/${notif.actor?.username}`}
                  className="notification-avatar-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="notification-avatar">
                    {notif.actor?.avatar && notif.actor.avatar.trim() !== '' ? (
                      <img src={notif.actor.avatar} alt={notif.actor.displayName} />
                    ) : (
                      notif.actor?.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <Link
                      to={`/profile/${notif.actor?.username}`}
                      className="notification-actor-name"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notif.actor?.displayName}
                    </Link>
                    <span className="notification-time">{formatDate(notif.createdAt)}</span>
                  </div>
                  <p className="notification-message">
                    <span className="notification-icon">{getNotificationIcon(notif.type)}</span>
                    {notif.message}
                  </p>
                  {notif.post && notif.type !== 'follow' && (
                    <p className="notification-post-preview">
                      &quot;{notif.post.content.substring(0, 100)}...&quot;
                    </p>
                  )}
                </div>
                
                {!notif.read && <div className="notification-unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;