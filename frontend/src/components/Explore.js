import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './Explore.css';

function Explore({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/trending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      
      // Build following map
      const map = {};
      response.data.forEach(u => {
        map[u._id] = u.followers?.some(f => f._id === user.id || f === user.id) || false;
      });
      setFollowingMap(map);
      setLoading(false);
    } catch (error) {
      console.log('Trending users авах алдаа:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingUsers();
  }, []);

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const isNowFollowing = !followingMap[userId];
      setFollowingMap(prev => ({
        ...prev,
        [userId]: isNowFollowing
      }));
      fetchTrendingUsers();
    } catch (error) {
      console.error('Follow хийхэд алдаа:', error);
    }
  };

  // Real-time search filter (exclude current user)
  const filteredUsers = users.filter(u =>
    u._id !== user.id && (
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Олж танилцах</h2>
        </div>
        
        <div className="explore-search-bar">
          <input
            type="text"
            placeholder="Хүний нэр эсвэл хэрэглэгчийн нэр хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : (
          <div className="explore-container">
            <div className="explore-section">
              <h3>🌟 {searchQuery ? 'Хайлтын үр дүн' : 'Хамгийн сайн хүмүүс'}</h3>
              
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>{searchQuery ? 'Хэрэглэгч олдсонгүй' : 'Хэрэглэгч байхгүй байна'}</p>
                </div>
              ) : (
                <div className="users-grid">
                  {filteredUsers.map(u => (
                    <div key={u._id} className="user-card">
                      <Link 
                        to={`/profile/${u.username}`}
                        className="user-card-link"
                      >
                        <div className="user-card-avatar">
                          {u.avatar && u.avatar.trim() !== '' ? (
                            <img src={u.avatar} alt={u.displayName} />
                          ) : (
                            u.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="user-card-info">
                          <h4>{u.displayName}</h4>
                          <p>@{u.username}</p>
                          <p className="user-bio">{u.bio || 'Био байхгүй'}</p>
                          <p className="user-followers">
                            {u.followers?.length || 0} follow эрхүүлэгч
                          </p>
                        </div>
                      </Link>
                      
                      {u._id !== user.id && (
                        <button
                          className={`follow-btn ${followingMap[u._id] ? 'following' : ''}`}
                          onClick={() => handleFollow(u._id)}
                        >
                          {followingMap[u._id] ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;