import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import CreatePost from './CreatePost';
import './Home.css';

function Home({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>Home</h2>
        </div>
        
        <CreatePost user={user} onPostCreated={handleNewPost} />
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : (
          <div className="posts-container">
            {posts.length === 0 ? (
              <div className="empty-state">
                <p>🐦 Пост байхгүй байна. Эхний постоо бичээрэй!</p>
              </div>
            ) : (
              posts.map(post => (
                <Post key={post._id} post={post} currentUser={user} />
              ))
            )}
          </div>
        )}
      </div>

      <div className="right-sidebar">
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