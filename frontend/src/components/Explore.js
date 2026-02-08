import React from 'react';
import Sidebar from './Sidebar';
import './Explore.css';

function Explore({ user, onLogout }) {
  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Explore</h2>
        </div>
        
        <div className="explore-content">
          <p>🔍 Шинэ зүйл олох хэсэг</p>
          <p>Удахгүй нэмэгдэх болно...</p>
        </div>
      </div>
    </div>
  );
}

export default Explore;