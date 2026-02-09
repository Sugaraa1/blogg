import React, { useState, useEffect, useRef } from 'react';
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
      // Post was deleted, trigger a refresh
      fetchPosts();
    }
  };

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Home</h2>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : (
          <div className="posts-container">
            {(() => {
              const displayed = followingOnly && user?.following && user.following.length > 0
                ? posts.filter(p => user.following.map(String).includes(String(p.author?._id || p.author)))
                : posts;

              if (displayed.length === 0) {
                return (
                  <div className="empty-state">
                    <p>🐦 Пост байхгүй байна. Эхний постоо бичээрэй!</p>
                  </div>
                );
              }

              return displayed.map(post => (
                <Post key={post._id} post={post} currentUser={user} onPostUpdate={handlePostUpdate} />
              ));
            })()}
          </div>
        )}
      </div>

      <div className="right-sidebar" id="create-post-section">
        <div className="composer-widget">
          <CreatePost user={user} onPostCreated={handleNewPost} />
        </div>
        <div className="trends-widget">
          <h3>Trends</h3>
          <div className="trend-item">
            <span className="trend-category">Technology</span>
            <span className="trend-name">#ReactJS</span>
            <span className="trend-count">12.5K Posts</span>
          </div>
          <div className="trend-item">
            <span className="trend-category">Programming</span>
            <span className="trend-name">#MongoDB</span>
            <span className="trend-count">8.3K Posts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;