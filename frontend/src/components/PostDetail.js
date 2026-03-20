import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import './PostDetail.css';

function PostDetail({ user, onLogout }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get('${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/posts');
        const foundPost = response.data.find(p => p._id === postId);
        
        if (foundPost) {
          setPost(foundPost);
        } else {
          // Post not found, redirect to home
          navigate('/');
        }
        setLoading(false);
      } catch (error) {
        console.error('Пост татахад алдаа:', error);
        navigate('/');
      }
    };

    fetchPost();
  }, [postId, navigate]);

  const handlePostUpdate = (updatedPost) => {
    if (updatedPost === null) {
      // Post was deleted, redirect to home
      navigate('/');
    } else {
      setPost(updatedPost);
    }
  };

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Буцах
          </button>
          <h2>Пост</h2>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        ) : post ? (
          <div className="post-detail-container">
            <Post
              post={post}
              currentUser={user}
              onPostUpdate={handlePostUpdate}
              showComments={true}
            />
          </div>
        ) : (
          <div className="empty-state">
            <p>Пост олдсонгүй</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetail;
