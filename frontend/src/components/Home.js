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
  }, []);

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    if (updatedPost === null) {
      fetchPosts();
    }
  };

  // 🆕 ЗАСВАРЛАСАН Filter logic
  const getFilteredPosts = () => {
    if (!followingOnly) {
      return posts;
    }
    
    // User-ийн following array авах
    const followingIds = user.following || [];
    
    // Following list хоосон бол хоосон array буцаана
    if (followingIds.length === 0) {
      return [];
    }
    
    // Follow хийсэн хүмүүсийн пост + өөрийнхөө пост харуулах
    return posts.filter(post => {
      const authorId = post.author?._id || post.author;
      // String болгож харьцуулах
      const authorIdStr = String(authorId);
      const userIdStr = String(user.id);
      
      // Following list дээр байгаа эсэх шалгах
      const isFollowing = followingIds.some(followId => 
        String(followId._id || followId) === authorIdStr
      );
      
      // Өөрийн пост эсвэл follow хийсэн хүний пост
      return isFollowing || authorIdStr === userIdStr;
    });
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Home</h2>
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