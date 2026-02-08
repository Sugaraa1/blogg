import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/explore', icon: '🔍', label: 'Explore' },
    { path: '/notifications', icon: '🔔', label: 'Notifications' },
    { path: `/profile/${user.username}`, icon: '👤', label: 'Profile' },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🐦</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <button className="tweet-button">Пост</button>

      <div className="theme-toggle-container">
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="theme-label">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user.displayName}</div>
            <div className="user-username">@{user.username}</div>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          🚪 Гарах
        </button>
      </div>
    </div>
  );
}

export default Sidebar;