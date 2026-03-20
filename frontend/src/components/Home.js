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

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const isBlocked = blockedUsers.some(blockedId =>
        String(blockedId._id || blockedId) === String(authorId)
      );
      return !isBlocked;
    });

    if (followingOnly) {
      const followingIds = user.following || [];
      if (followingIds.length === 0) return [];
      filtered = filtered.filter(post => {
        const authorId = post.author?._id || post.author;
        if (String(authorId) === String(user.id)) return false;
        return followingIds.some(followId =>
          String(followId._id || followId) === String(authorId)
        );
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
                <p>
                  {followingOnly
                    ? '📭 Та одоогоор хэнийг ч дагаагүй байна.'
                    : '🐦 Пост байхгүй байна.'}
                </p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <Post
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onPostUpdate={handlePostUpdate}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div className="right-sidebar" id="create-post-section">
        <div className="composer-widget">
          <CreatePost user={user} onPostCreated={handleNewPost} />
        </div>
      </div>

      <Statistics currentUser={user} />
    </div>
  );
}

export default Home;