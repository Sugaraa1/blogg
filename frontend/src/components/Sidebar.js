import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/explore', icon: '🔍', label: 'Explore' },
    { path: '/notifications', icon: '🔔', label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
    { path: `/profile/${user.username}`, icon: '👤', label: 'Profile' },
  ];

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.log('Unread count авах алдаа:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Avatar зураг шалгах - хоосон string эсвэл undefined
  const hasAvatar = user.avatar && user.avatar.trim() !== '';

  return (
    <div className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="logo-icon">🐦</div>
        <div className="logo-text">Э-Блог</div>
      </Link>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon-wrapper">
              <span className="nav-icon">{item.icon}</span>
              {item.badge && <span className="notification-badge">{item.badge}</span>}
            </span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <button 
        className="tweet-button"
        onClick={() => {
          if (location.pathname === '/') {
            // Scroll to post creation area
            const element = document.getElementById('create-post-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              element.querySelector('textarea')?.focus();
            }
          } else {
            // Navigate to home
            navigate('/');
          }
        }}
      >
        Пост
      </button>

      <div className="theme-toggle-container">
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="theme-label">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>

      <div className="sidebar-footer">
        <Link to={`/profile/${user.username}`} className="user-profile-link">
          <div className="user-profile">
            <div className="user-avatar">
              {hasAvatar ? (
                <img src={user.avatar} alt={user.displayName} />
              ) : (
                getInitials(user.displayName)
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{user.displayName}</div>
              <div className="user-username">@{user.username}</div>
            </div>
          </div>
        </Link>
        <button className="logout-button" onClick={handleLogout}>
          🚪 Гарах
        </button>
      </div>
    </div>
  );
}

export default Sidebar;