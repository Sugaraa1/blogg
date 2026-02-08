import React, { useState } from 'react';
import axios from 'axios';
import './CreatePost.css';

function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/posts',
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onPostCreated(response.data);
      setContent('');
    } catch (error) {
      console.error('Пост үүсгэхэд алдаа:', error);
      alert('Пост үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
    setPosting(false);
  };

  return (
    <div className="create-post">
      <div className="create-post-header">
        <div className="user-avatar-small">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            placeholder="Юу бодож байна?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <div className="post-actions">
            <span className="char-count">{content.length}/280</span>
            <button type="submit" disabled={!content.trim() || posting}>
              {posting ? 'Илгээж байна...' : 'Пост оруулах'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;