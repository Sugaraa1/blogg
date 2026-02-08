import React from 'react';
import Sidebar from './Sidebar';
import './Notifications.css';

function Notifications({ user, onLogout }) {
  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Notifications</h2>
        </div>
        
        <div className="notifications-content">
          <p>🔔 Мэдэгдэл хэсэг</p>
          <p>Удахгүй нэмэгдэх болно...</p>
        </div>
      </div>
    </div>
  );
}

export default Notifications;