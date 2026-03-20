import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './Explore.css';

function Explore({ user, onLogout, updateUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]); // 🆕 Blocked users

  // 🆕 Blocked users авах
  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Blocked users авахад алдаа:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/search?q=&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      
      const map = {};
      const currentUserFollowing = user.following || [];
      
      response.data.forEach(u => {
        const isFollowing = currentUserFollowing.some(f => 
          String(f._id || f) === String(u._id)
        );
        map[u._id] = isFollowing;
      });
      
      setFollowingMap(map);
      setLoading(false);
    } catch (error) {
      console.log('Users авах алдаа:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchBlockedUsers(); // 🆕 Blocked users авах
  }, []);

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const isNowFollowing = response.data.isFollowing;
      
      setFollowingMap(prev => ({
        ...prev,
        [userId]: isNowFollowing
      }));
      
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u._id === userId) {
            return {
              ...u,
              followers: isNowFollowing 
                ? [...(u.followers || []), { _id: user.id }]
                : (u.followers || []).filter(f => String(f._id || f) !== String(user.id))
            };
          }
          return u;
        })
      );
      
      if (updateUser) {
        const updatedUser = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${user.username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updateUser({
          ...user,
          following: updatedUser.data.following,
          followers: updatedUser.data.followers
        });
      }
    } catch (error) {
      console.error('Follow хийхэд алдаа:', error);
      alert('Follow хийхэд алдаа гарлаа');
    }
  };

  // ✅ ЗАСВАРЛАСАН: Өөрийгөө болон blocked users-ийг хасах
  const filteredUsers = users.filter(u => {
    // Өөрийгөө хасах
    if (u._id === user.id) return false;
    
    // 🆕 Blocked users хасах
    const isBlocked = blockedUsers.some(blockedId => 
      String(blockedId._id || blockedId) === String(u._id)
    );
    if (isBlocked) return false;
    
    // Search query шүүлт
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

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
              <h3>{searchQuery ? 'Хайлтын үр дүн' : 'Бүх хэрэглэгчид'}</h3>
              
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>
                    {searchQuery 
                      ? 'Хэрэглэгч олдсонгүй' 
                      : 'Хэрэглэгч байхгүй байна'
                    }
                  </p>
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
                          <p className="user-stats">
                            <span className="user-followers">{u.followers?.length || 0} дагагч</span>
                            {' · '}
                            <span className="user-following">{u.following?.length || 0} дагаж байна</span>
                          </p>
                        </div>
                      </Link>
                      
                      <button
                        className={`follow-btn ${followingMap[u._id] ? 'following' : ''}`}
                        onClick={() => handleFollow(u._id)}
                      >
                        {followingMap[u._id] ? 'Дагаж байна' : 'Дагах'}
                      </button>
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