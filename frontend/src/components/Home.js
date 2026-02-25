import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import CreatePost from './CreatePost';
import './Home.css';

function Home({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]); // 🆕 Blocked users list

  // 🆕 Blocked users авах
  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Blocked users авахад алдаа:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Пост татахад алдаа:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchBlockedUsers(); // 🆕 Blocked users авах
  }, []);

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    if (updatedPost === null) {
      fetchPosts();
    }
  };

  // ✅ ЗАСВАРЛАСАН Filter logic - blocked users болон өөрийн постыг хасах
  const getFilteredPosts = () => {
    let filtered = posts;

    // 🆕 BLOCKED USERS-ийн постыг хасах
    filtered = filtered.filter(post => {
      const authorId = post.author?._id || post.author;
      const isBlocked = blockedUsers.some(blockedId => 
        String(blockedId._id || blockedId) === String(authorId)
      );
      return !isBlocked; // Blocked хэрэглэгчийн пост харуулахгүй
    });

    // Following filter
    if (followingOnly) {
      const followingIds = user.following || [];
      
      if (followingIds.length === 0) {
        return [];
      }
      
      filtered = filtered.filter(post => {
        const authorId = post.author?._id || post.author;
        const authorIdStr = String(authorId);
        const userIdStr = String(user.id);
        
        // Өөрийн постыг хасах
        if (authorIdStr === userIdStr) {
          return false;
        }
        
        // Following list дээр байгаа эсэх шалгах
        const isFollowing = followingIds.some(followId => 
          String(followId._id || followId) === authorIdStr
        );
        
        return isFollowing;
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
        
        {/* Filter Tabs */}
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
                    ? '📭 Та одоогоор хэнийг ч дагаагүй байна. Explore хэсэгт очоод хүмүүс олоорой!'
                    : '🐦 Пост байхгүй байна.'
                  }
                </p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <Post key={post._id} post={post} currentUser={user} onPostUpdate={handlePostUpdate} />
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
    </div>
  );
}

export default Home;