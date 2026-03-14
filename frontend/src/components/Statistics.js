import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Statistics.css';

function Statistics({ currentUser }) {
  const navigate = useNavigate();
  const [showStatistics, setShowStatistics] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  // ✅ useCallback - dependency warning арилгах
  const fetchTrendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(
          `http://localhost:5000/api/statistics/trending-users?period=${timeFilter}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTrendingUsers(response.data);
      } catch {
        const response = await axios.get('http://localhost:5000/api/users/search?q=&limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let users = response.data.filter(u => u._id !== currentUser.id);
        users.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));
        setTrendingUsers(users.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching trending users:', error);
    }
    setLoading(false);
  }, [timeFilter, currentUser.id]);

  const fetchPopularPosts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(
          `http://localhost:5000/api/statistics/popular-posts?period=${timeFilter}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPopularPosts(response.data);
      } catch {
        const response = await axios.get('http://localhost:5000/api/posts');
        let posts = response.data;

        // ✅ filterDate - зөвхөн энд ашиглах (unused var warning арилгав)
        if (timeFilter !== 'all') {
          const msMap = { '7days': 7, 'month': 30 };
          const days = msMap[timeFilter] || 0;
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          posts = posts.filter(p => new Date(p.createdAt) >= cutoff);
        }

        const scored = posts.map(post => ({
          ...post,
          likesCount: post.likes?.length || 0,
          commentsCount: post.comments?.length || 0,
          retweetsCount: post.retweets?.length || 0,
          viewsCount: post.views?.length || 0,
          engagementScore:
            (post.likes?.length || 0) +
            (post.comments?.length || 0) * 2 +
            (post.retweets?.length || 0) * 1.5 +
            (post.views?.length || 0) * 0.1
        }));

        setPopularPosts(scored.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching popular posts:', error);
    }
    setLoading(false);
  }, [timeFilter]);

  // ✅ dependency array зөв
  useEffect(() => {
    if (!showStatistics) return;
    if (activeTab === 'users') {
      fetchTrendingUsers();
    } else {
      fetchPopularPosts();
    }
  }, [showStatistics, activeTab, timeFilter, fetchTrendingUsers, fetchPopularPosts]);

  const getRankIcon = (i) => ['🥇','🥈','🥉'][i] ?? i + 1;
  const getRankClass = (i) => ['gold','silver','bronze'][i] ?? '';

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n;
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http') || avatar.startsWith('data:image')) return avatar;
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
            <h3><span className="stat-icon">📊</span> Статистик</h3>
            <button className="close-statistics-btn" onClick={() => setShowStatistics(false)}>✕</button>
          </div>

          <div className="statistics-tabs">
            <button className={`stat-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <span>👥</span><span>Trending</span>
            </button>
            <button className={`stat-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
              <span>🔥</span><span>Popular</span>
            </button>
          </div>

          <div className="time-filter-section">
            <div className="time-filter-label"><span className="filter-icon">🕐</span><span>Хугацаа:</span></div>
            <div className="time-filter-buttons">
              {['7days','month','all'].map(f => (
                <button
                  key={f}
                  className={`time-filter-btn ${timeFilter === f ? 'active' : ''}`}
                  onClick={() => setTimeFilter(f)}
                >
                  {f === '7days' ? '7 хоног' : f === 'month' ? 'Сар' : 'Бүгд'}
                </button>
              ))}
            </div>
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
                    <p>Хэрэглэгч байхгүй</p>
                  </div>
                ) : trendingUsers.map((u, i) => (
                  <div key={u._id} className="trending-user-card" onClick={() => { navigate(`/profile/${u.username}`); setShowStatistics(false); }}>
                    <div className={`user-rank ${getRankClass(i)}`}>{getRankIcon(i)}</div>
                    <div className="trending-user-avatar">
                      {getAvatarUrl(u.avatar)
                        ? <img src={getAvatarUrl(u.avatar)} alt={u.displayName} />
                        : u.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="trending-user-info">
                      <p className="trending-user-name">{u.displayName || u.username}</p>
                      <p className="trending-user-handle">@{u.username}</p>
                      <div className="trending-user-stats">
                        <div className="stat-item">
                          <span>👥</span>
                          <span className="stat-number">{formatNumber(u.totalFollowers || u.followers?.length || 0)}</span>
                          <span>дагагч</span>
                        </div>
                        {timeFilter !== 'all' && (u.recentFollowers > 0) && (
                          <div className="stat-item growth">
                            <span>📈</span>
                            <span className="stat-number growth-number">+{formatNumber(u.recentFollowers)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="popular-posts-list">
                {popularPosts.length === 0 ? (
                  <div className="empty-statistics">
                    <div className="empty-statistics-icon">🔥</div>
                    <p>Пост байхгүй</p>
                  </div>
                ) : popularPosts.map((post, i) => (
                  <div key={post._id} className="popular-post-card" onClick={() => { navigate(`/post/${post._id}`); setShowStatistics(false); }}>
                    <div className="post-header">
                      <div className={`post-rank ${getRankClass(i)}`}>{getRankIcon(i)}</div>
                      <div className="post-author-avatar">
                        {getAvatarUrl(post.author?.avatar)
                          ? <img src={getAvatarUrl(post.author.avatar)} alt={post.author.displayName} />
                          : post.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="post-author-info">
                        <p className="post-author-name">{post.author?.displayName}</p>
                        <p className="post-author-handle">@{post.author?.username}</p>
                      </div>
                    </div>
                    <div className="post-content">{post.content}</div>
                    {post.image && (
                      <img
                        src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                        alt="Post"
                        className="post-image-preview"
                      />
                    )}
                    <div className="post-stats">
                      <div className="post-stat"><span>❤️</span><span className="post-stat-number">{formatNumber(post.likesCount || post.likes?.length || 0)}</span></div>
                      <div className="post-stat"><span>💬</span><span className="post-stat-number">{formatNumber(post.commentsCount || post.comments?.length || 0)}</span></div>
                      <div className="post-stat"><span>🔄</span><span className="post-stat-number">{formatNumber(post.retweetsCount || post.retweets?.length || 0)}</span></div>
                      <div className="post-stat"><span>👁️</span><span className="post-stat-number">{formatNumber(post.viewsCount || post.views?.length || 0)}</span></div>
                      <div className="post-stat engagement"><span>🔥</span><span className="post-stat-number">{formatNumber(Math.round(post.engagementScore))}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;