import React, { useState } from 'react';
import axios from 'axios';
import './Post.css';

function Post({ post, currentUser }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikes(response.data.likes);
    } catch (error) {
      console.error('Like хийхэд алдаа:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/posts/${post._id}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.comments);
      setCommentText('');
    } catch (error) {
      console.error('Comment хийхэд алдаа:', error);
    }
  };

  const isLiked = likes.includes(currentUser.id);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Дөнгөж сая';
    if (diffMins < 60) return `${diffMins}м`;
    if (diffHours < 24) return `${diffHours}ц`;
    if (diffDays < 7) return `${diffDays}ө`;
    return date.toLocaleDateString('mn-MN');
  };

  return (
    <div className="post">
      <div className="post-avatar">
        {post.author?.displayName.charAt(0).toUpperCase()}
      </div>
      
      <div className="post-body">
        <div className="post-header">
          <div className="post-author-info">
            <span className="author-name">{post.author?.displayName}</span>
            <span className="author-username">@{post.author?.username}</span>
            <span className="post-separator">·</span>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        <div className="post-content">
          <p>{post.content}</p>
        </div>

        <div className="post-actions">
          <button 
            onClick={() => setShowComments(!showComments)} 
            className="action-btn comment-btn"
          >
            <span className="action-icon">💬</span>
            <span className="action-count">{comments.length}</span>
          </button>
          
          <button className="action-btn retweet-btn">
            <span className="action-icon">🔄</span>
            <span className="action-count">0</span>
          </button>
          
          <button 
            onClick={handleLike} 
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          >
            <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
            <span className="action-count">{likes.length}</span>
          </button>
          
          <button className="action-btn share-btn">
            <span className="action-icon">📤</span>
          </button>
        </div>

        {showComments && (
          <div className="comments-section">
            <form onSubmit={handleComment} className="comment-form">
              <div className="comment-avatar-small">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                placeholder="Хариулт бичих..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim()}>
                Хариулах
              </button>
            </form>
            
            <div className="comments-list">
              {comments.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-avatar-small">
                    {comment.user?.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-author">
                      <strong>{comment.user?.displayName}</strong>
                      <span>@{comment.user?.username}</span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Post;