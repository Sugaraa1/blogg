import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Statistics.css';

function Statistics({ currentUser }) {
  const navigate = useNavigate();
  const [showStatistics, setShowStatistics] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'posts'
  const [loading, setLoading] = useState(false);
  
  // Data
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  useEffect(() => {
    if (showStatistics) {
      if (activeTab === 'users') {
        fetchTrendingUsers();
      } else {
        fetchPopularPosts();
      }
    }
  }, [showStatistics, activeTab]);

  const fetchTrendingUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/search?q=&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort by followers count
      const sorted = response.data
        .filter(u => u._id !== currentUser.id)
        .sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0))
        .slice(0, 10);
      
      setTrendingUsers(sorted);
    } catch (error) {
      console.error('Error fetching trending users:', error);
    }
    setLoading(false);
  };

  const fetchPopularPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      
      // Calculate engagement score: likes + comments*2 + retweets*1.5 + views*0.1
      const postsWithScore = response.data.map(post => ({
        ...post,
        engagementScore: 
          (post.likes?.length || 0) + 
          (post.comments?.length || 0) * 2 + 
          (post.retweets?.length || 0) * 1.5 + 
          (post.views?.length || 0) * 0.1
      }));
      
      // Sort by engagement score
      const sorted = postsWithScore
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10);
      
      setPopularPosts(sorted);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
    }
    setLoading(false);
  };

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const getRankClass = (index) => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setShowStatistics(false);
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
    setShowStatistics(false);
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:image')) return avatar;
    return `http://localhost:5000${avatar}`;
  };

  return (
    <div className="statistics-container">
      {!showStatistics && (
        <button 
          className="statistics-toggle-btn"
          onClick={() => setShowStatistics(true)}
          title="Статистик"
        >
          📊
        </button>
      )}

      {showStatistics && (
        <div className="statistics-modal">
          <div className="statistics-header">
            <h3>
              <span className="stat-icon">📊</span>
              Статистик
            </h3>
            <button 
              className="close-statistics-btn"
              onClick={() => setShowStatistics(false)}
            >
              ✕
            </button>
          </div>

          <div className="statistics-tabs">
            <button
              className={`stat-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span>👥</span>
              <span>Trending Users</span>
            </button>
            <button
              className={`stat-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <span>🔥</span>
              <span>Popular Posts</span>
            </button>
          </div>

          <div className="statistics-content">
            {loading ? (
              <div className="loading-statistics">
                <div className="stat-spinner"></div>
                <p>Ачаалж байна...</p>
              </div>
            ) : activeTab === 'users' ? (
              <div className="trending-users-list">
                {trendingUsers.length === 0 ? (
                  <div className="empty-statistics">
                    <div className="empty-statistics-icon">👥</div>
                    <p>Trending хэрэглэгч байхгүй</p>
                  </div>
                ) : (
                  trendingUsers.map((user, index) => (
                    <div
                      key={user._id}
                      className="trending-user-card"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <div className={`user-rank ${getRankClass(index)}`}>
                        {getRankIcon(index)}
                      </div>
                      
                      <div className="trending-user-avatar">
                        {getAvatarUrl(user.avatar) ? (
                          <img src={getAvatarUrl(user.avatar)} alt={user.displayName} />
                        ) : (
                          user.displayName?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>

                      <div className="trending-user-info">
                        <p className="trending-user-name">{user.displayName || user.username}</p>
                        <p className="trending-user-handle">@{user.username}</p>
                        <div className="trending-user-stats">
                          <div className="stat-item">
                            <span>👥</span>
                            <span className="stat-number">{formatNumber(user.followers?.length || 0)}</span>
                            <span>дагагч</span>
                          </div>
                          <div className="stat-item">
                            <span>➡️</span>
                            <span className="stat-number">{formatNumber(user.following?.length || 0)}</span>
                            <span>дагаж байна</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="popular-posts-list">
                {popularPosts.length === 0 ? (
                  <div className="empty-statistics">
                    <div className="empty-statistics-icon">🔥</div>
                    <p>Popular пост байхгүй</p>
                  </div>
                ) : (
                  popularPosts.map((post, index) => (
                    <div
                      key={post._id}
                      className="popular-post-card"
                      onClick={() => handlePostClick(post._id)}
                    >
                      <div className="post-header">
                        <div className={`post-rank ${getRankClass(index)}`}>
                          {getRankIcon(index)}
                        </div>
                        
                        <div className="post-author-avatar">
                          {getAvatarUrl(post.author?.avatar) ? (
                            <img src={getAvatarUrl(post.author.avatar)} alt={post.author.displayName} />
                          ) : (
                            post.author?.displayName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>

                        <div className="post-author-info">
                          <p className="post-author-name">{post.author?.displayName || post.author?.username}</p>
                          <p className="post-author-handle">@{post.author?.username}</p>
                        </div>
                      </div>

                      <div className="post-content">
                        {post.content}
                      </div>

                      {post.image && (
                        <img 
                          src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                          alt="Post"
                          className="post-image-preview"
                        />
                      )}

                      <div className="post-stats">
                        <div className="post-stat">
                          <span>❤️</span>
                          <span className="post-stat-number">{formatNumber(post.likes?.length || 0)}</span>
                        </div>
                        <div className="post-stat">
                          <span>💬</span>
                          <span className="post-stat-number">{formatNumber(post.comments?.length || 0)}</span>
                        </div>
                        <div className="post-stat">
                          <span>🔄</span>
                          <span className="post-stat-number">{formatNumber(post.retweets?.length || 0)}</span>
                        </div>
                        <div className="post-stat">
                          <span>👁️</span>
                          <span className="post-stat-number">{formatNumber(post.views?.length || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;