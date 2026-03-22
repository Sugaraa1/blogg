import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import CreatePost from './CreatePost';
import Statistics from './Statistics';
import './Home.css';

function Home({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showMobileComposer, setShowMobileComposer] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${user.username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Blocked users авахад алдаа:', error);
    }
  }, [user.username]);

  const fetchPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const followingIds = JSON.stringify(
        (user.following || []).map(f => f._id || f)
      );
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/posts/feed?userId=${user.id}&following=${encodeURIComponent(followingIds)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Пост татахад алдаа:', error);
      setLoading(false);
    }
  }, [user.id, user.following]);

  useEffect(() => {
    fetchPosts();
    fetchBlockedUsers();
  }, [fetchPosts, fetchBlockedUsers]);

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowMobileComposer(false);
  };

  const handlePostUpdate = (updatedPost) => {
    if (updatedPost === null) {
      fetchPosts();
    } else {
      setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    }
  };

  const getFilteredPosts = () => {
    let filtered = posts;
    filtered = filtered.filter(post => {
      const authorId = post.author?._id || post.author;
      return !blockedUsers.some(b => String(b._id || b) === String(authorId));
    });
    if (followingOnly) {
      const followingIds = user.following || [];
      if (followingIds.length === 0) return [];
      filtered = filtered.filter(post => {
        const authorId = post.author?._id || post.author;
        if (String(authorId) === String(user.id)) return false;
        return followingIds.some(f => String(f._id || f) === String(authorId));
      });
    }
    return filtered;
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="main-content">
        <div className="content-header">
          <h2>Нүүр</h2>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${!followingOnly ? 'active' : ''}`}
            onClick={() => setFollowingOnly(false)}
          >
            Бүх пост
          </button>
          <button
            className={`filter-tab ${followingOnly ? 'active' : ''}`}
            onClick={() => setFollowingOnly(true)}
          >
            Дагаж байгаа
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : (
          <div className="posts-container">
            {filteredPosts.length === 0 ? (
              <div className="empty-state">
                <p>{followingOnly ? '📭 Та одоогоор хэнийг ч дагаагүй байна.' : '🐦 Пост байхгүй байна.'}</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <Post key={post._id} post={post} currentUser={user} onPostUpdate={handlePostUpdate} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Desktop right sidebar */}
      <div className="right-sidebar" id="create-post-section">
        <div className="composer-widget">
          <CreatePost user={user} onPostCreated={handleNewPost} />
        </div>
      </div>

      {/* Mobile: floating create button */}
      <button
        className="mobile-create-btn"
        onClick={() => setShowMobileComposer(true)}
      >
        +
      </button>

      {/* Mobile: create post modal */}
      {showMobileComposer && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end'
          }}
          onClick={() => setShowMobileComposer(false)}
        >
          <div
            style={{
              width: '100%', background: 'var(--bg-secondary)',
              borderRadius: '20px 20px 0 0', padding: '20px 16px 32px',
              border: '1px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <CreatePost user={user} onPostCreated={handleNewPost} />
          </div>
        </div>
      )}

      <Statistics currentUser={user} />
    </div>
  );
}

export default Home;