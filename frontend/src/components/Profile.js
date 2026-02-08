import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './Profile.css';

function Profile({ user, onLogout }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${username}`);
        setProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Profile татахад алдаа:', error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="home-layout">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="loading">Уншиж байна...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="home-layout">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="error">Хэрэглэгч олдсонгүй</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Profile</h2>
        </div>
        
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{profile.displayName}</h2>
              <p>@{profile.username}</p>
              {profile.bio && <p className="bio">{profile.bio}</p>}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat">
              <strong>{profile.followers?.length || 0}</strong>
              <span>Followers</span>
            </div>
            <div className="stat">
              <strong>{profile.following?.length || 0}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;