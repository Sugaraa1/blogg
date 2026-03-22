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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Нүүр' },
    { path: '/explore', icon: '🔍', label: 'Хайх' },
    {
      path: '/notifications',
      icon: '🔔',
      label: 'Мэдэгдэл',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { path: `/profile/${user.username}`, icon: '👤', label: 'Профайл' },
  ];

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setShowMobileMenu(false);
    onLogout();
    navigate('/login');
  };

  const handlePostBtn = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('create-post-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.querySelector('textarea')?.focus();
      }
    } else {
      navigate('/');
    }
  };

  const hasAvatar = user.avatar && user.avatar.trim() !== '';

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar">
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon">🐦</div>
          <span className="logo-text">Э-Блог</span>
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
                {item.badge && (
                  <span className="notification-badge">{item.badge}</span>
                )}
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="tweet-button" onClick={handlePostBtn}>
          Пост
        </button>

        <div className="theme-toggle-container">
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="theme-label"></span>
          </button>
        </div>

        <div className="sidebar-footer">
          <Link to={`/profile/${user.username}`} className="user-profile-link">
            <div className="user-profile">
              <div className="user-avatar">
                {hasAvatar
                  ? <img src={user.avatar} alt={user.displayName} />
                  : user.displayName?.charAt(0).toUpperCase() || '?'
                }
              </div>
              <div className="user-details">
                <div className="user-name">{user.displayName}</div>
                <div className="user-username">@{user.username}</div>
              </div>
            </div>
          </Link>
          <button className="logout-button" onClick={handleLogout}>
            Гарах
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon-wrap">
              <span className="nav-icon">{item.icon}</span>
              {item.badge && (
                <span className="notification-badge">{item.badge}</span>
              )}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}

        {/* More button */}
        <button
          className="mobile-nav-item"
          onClick={() => setShowMobileMenu(true)}
        >
          <span className="mobile-nav-icon-wrap">
            <span className="nav-icon">⚙️</span>
          </span>
          <span className="mobile-nav-label">Цэс</span>
        </button>
      </div>

      {/* Mobile menu modal */}
      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="mobile-menu-sheet"
            onClick={e => e.stopPropagation()}
          >
            <div className="mobile-menu-handle" />

            <div className="mobile-menu-user">
              <div className="mobile-menu-avatar">
                {hasAvatar
                  ? <img src={user.avatar} alt={user.displayName} />
                  : user.displayName?.charAt(0).toUpperCase() || '?'
                }
              </div>
              <div>
                <div className="mobile-menu-name">{user.displayName}</div>
                <div className="mobile-menu-username">@{user.username}</div>
              </div>
            </div>

            <div className="mobile-menu-divider" />

            <button className="mobile-menu-item" onClick={toggleTheme}>
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'Харанхуй горим' : 'Гэрэл горим'}</span>
            </button>

            <Link
              to={`/profile/${user.username}`}
              className="mobile-menu-item"
              onClick={() => setShowMobileMenu(false)}
            >
              <span>👤</span>
              <span>Профайл</span>
            </Link>

            <div className="mobile-menu-divider" />

            <button
              className="mobile-menu-item logout"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Гарах</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;