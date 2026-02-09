import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

function Post({ post, currentUser, onPostUpdate, showComments: initialShowComments = false }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [retweets, setRetweets] = useState(post.retweets || []);
  const [views, setViews] = useState(post.views || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(initialShowComments);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [isReposted, setIsReposted] = useState(false);

  // Display original post if this is a repost
  const displayPost = post.repostedPost || post;
  const isOwnRepost = post.repostedPost && post.author._id === currentUser.id;
  const isOwnPost = displayPost.author?._id === currentUser.id;
  
  // For retweets, use original post's retweets if this is a repost
  const displayRetweets = post.repostedPost ? (post.repostedPost.retweets || []) : retweets;
  const displayViews = post.repostedPost ? (post.repostedPost.views || []) : views;

  useEffect(() => {
    // Check if user has reposted (by seeing if this is their repost)
    if (post.repostedPost && String(post.author._id) === String(currentUser.id)) {
      setIsReposted(true);
    }
  }, [post._id, post.repostedPost, post.author._id, currentUser.id]);

  // Record view when post is loaded
  useEffect(() => {
    const recordView = async () => {
      try {
        const token = localStorage.getItem('token');
        const postId = post.repostedPost ? post.repostedPost._id : post._id;
        if (!views.includes(currentUser.id)) {
          const response = await axios.post(
            `http://localhost:5000/api/posts/${postId}/view`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setViews(response.data.views);
        }
      } catch (error) {
        console.log('View recording error:', error);
      }
    };
    recordView();
  }, [post._id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikes(response.data.likes);
      if (onPostUpdate) {
        onPostUpdate(response.data);
      }
    } catch (error) {
      console.error('Like хийхэд алдаа:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      if (onPostUpdate) {
        onPostUpdate(response.data);
      }
    } catch (error) {
      console.error('Comment хийхэд алдаа:', error);
    }
  };

  const handleRetweet = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      // Always repost the original post, not a repost
      const postToRepost = post.repostedPost ? post.repostedPost._id : post._id;
      const response = await axios.post(
        `http://localhost:5000/api/posts/${postToRepost}/repost`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsReposted(response.data.reposted);
      // Update retweets count from response
      if (response.data.post && response.data.post.retweets) {
        setRetweets(response.data.post.retweets);
      }
      if (onPostUpdate) {
        onPostUpdate(response.data.post || response.data.repost);
      }
    } catch (error) {
      console.error('Repost хийхэд алдаа:', error);
    }
  };

  const handleViewersClick = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const postId = post.repostedPost ? post.repostedPost._id : post._id;
      const response = await axios.get(
        `http://localhost:5000/api/posts/${postId}/viewers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewers(response.data);
      setShowViewers(true);
    } catch (error) {
      console.error('Хүмүүсийг авахад алдаа:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Энэ постыг устгахуу үнэхээр сайн уу?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const postIdToDelete = post.repostedPost ? post._id : post._id;
      await axios.delete(
        `http://localhost:5000/api/posts/${postIdToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (onPostUpdate) {
        onPostUpdate(null); // Signal to remove post from display
      }
    } catch (error) {
      console.error('Пост устгахад алдаа:', error);
      alert('Пост устгахад алдаа гарлаа');
    }
  };

  const handleDeleteComment = async (commentId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Энэ сэтгэгдлийг устгахуу үнэхээр сайн уу?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const postId = post.repostedPost ? post.repostedPost._id : post._id;
      
      await axios.delete(
        `http://localhost:5000/api/posts/${postId}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedComments = comments.filter(comment => comment._id !== commentId);
      setComments(updatedComments);
    } catch (error) {
      console.error('Сэтгэгдэл устгахад алдаа:', error);
      alert('Сэтгэгдэл устгахад алдаа гарлаа');
    }
  };

  const isLiked = likes.includes(currentUser.id);
  const isRetweeted = isReposted;
  
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
      <Link 
        to={`/profile/${displayPost.author?.username}`} 
        className="post-avatar-link"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-avatar">
          {displayPost.author?.avatar && displayPost.author.avatar.trim() !== '' ? (
            <img src={displayPost.author.avatar} alt={displayPost.author.displayName} />
          ) : (
            displayPost.author?.displayName.charAt(0).toUpperCase()
          )}
        </div>
      </Link>
      
      <div className="post-body">
        {isOwnRepost && (
          <div className="repost-indicator">
            <span>🔄 Та энэ постыг дахин бичлээ</span>
          </div>
        )}
        <div className="post-header">
          <div className="post-author-info">
            <Link 
              to={`/profile/${displayPost.author?.username}`}
              className="author-name"
              onClick={(e) => e.stopPropagation()}
            >
              {displayPost.author?.displayName}
            </Link>
            <span className="author-username">@{displayPost.author?.username}</span>
            <span className="post-separator">·</span>
            <span className="post-time">{formatDate(displayPost.createdAt)}</span>
          </div>
          {isOwnPost && (
            <button 
              className="delete-post-btn"
              onClick={handleDeletePost}
              title="Постыг устгах"
            >
              ✕
            </button>
          )}
        </div>

        <div className="post-content">
          <p>{displayPost.content}</p>
        </div>
        {displayPost.image && (
          <div className="post-image">
            <img
              src={displayPost.image.startsWith('http') ? displayPost.image : `http://localhost:5000${displayPost.image}`}
              alt="Post"
            />
          </div>
        )}

        <div className="post-actions">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }} 
            className="action-btn comment-btn"
          >
            <span className="action-icon">💬</span>
            <span className="action-count">{comments.length}</span>
          </button>
          
          <button 
            className={`action-btn retweet-btn ${isRetweeted ? 'retweeted' : ''}`}
            onClick={handleRetweet}
          >
            <span className="action-icon">🔄</span>
            <span className="action-count">{displayRetweets.length}</span>
          </button>
          
          <button 
            onClick={handleLike} 
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          >
            <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
            <span className="action-count">{likes.length}</span>
          </button>
          
          <button 
            className="action-btn views-btn"
            onClick={handleViewersClick}
          >
            <span className="action-icon">👁️</span>
            <span className="action-count">{displayViews.length}</span>
          </button>
          
          <button 
            className="action-btn share-btn"
            onClick={(e) => e.stopPropagation()}
          >
          </button>
        </div>

        {showViewers && (
          <div className="viewers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="viewers-content">
              <div className="viewers-header">
                <h3>Энэ постыг үзсэн хүмүүс</h3>
                <button onClick={() => setShowViewers(false)} className="close-btn">✕</button>
              </div>
              <div className="viewers-list">
                {viewers.length > 0 ? (
                  viewers.map((viewer) => (
                    <Link
                      key={viewer._id}
                      to={`/profile/${viewer.username}`}
                      className="viewer-item"
                      onClick={() => setShowViewers(false)}
                    >
                      <div className="viewer-avatar">
                        {viewer.avatar && viewer.avatar.trim() !== '' ? (
                          <img src={viewer.avatar} alt={viewer.displayName} />
                        ) : (
                          viewer.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="viewer-info">
                        <div className="viewer-name">{viewer.displayName}</div>
                        <div className="viewer-username">@{viewer.username}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="empty-viewers">Төлөө хүн үзсэнгүй</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showComments && (
          <div className="comments-section" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleComment} className="comment-form">
              <div className="comment-avatar-small">
                {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                  <img src={currentUser.avatar} alt={currentUser.displayName} />
                ) : (
                  currentUser.displayName.charAt(0).toUpperCase()
                )}
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
                  <Link 
                    to={`/profile/${comment.user?.username}`}
                    className="comment-avatar-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="comment-avatar-small">
                      {comment.user?.avatar && comment.user.avatar.trim() !== '' ? (
                        <img src={comment.user.avatar} alt={comment.user.displayName} />
                      ) : (
                        comment.user?.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="comment-body">
                    <div className="comment-author">
                      <Link 
                        to={`/profile/${comment.user?.username}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <strong>{comment.user?.displayName}</strong>
                      </Link>
                      <span>@{comment.user?.username}</span>
                      {comment.user?._id === currentUser.id && (
                        <button
                          className="delete-comment-btn"
                          onClick={(e) => handleDeleteComment(comment._id, e)}
                          title="Сэтгэгдлийг устгах"
                        >
                          ✕
                        </button>
                      )}
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