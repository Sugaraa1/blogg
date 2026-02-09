import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './CreatePost.css';

function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) formData.append('image', imageFile);

      const response = await axios.post(
        'http://localhost:5000/api/posts',
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      onPostCreated(response.data);
      setContent('');
      setImageFile(null);
    } catch (error) {
      console.error('Пост үүсгэхэд алдаа:', error);
      alert('Пост үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
    setPosting(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Avatar зураг шалгах - хоосон string эсвэл undefined
  const hasAvatar = user.avatar && user.avatar.trim() !== '';

  const triggerFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const removeImage = () => {
    setImageFile(null);
  };

  return (
    <div className="create-post">
      <div className="create-post-header card">
        <div className="user-avatar-small">
          {hasAvatar ? (
            <img src={user.avatar} alt={user.displayName} />
          ) : (
            getInitials(user.displayName)
          )}
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            placeholder="Юу бодож байна?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={3}
          />

          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" />
              <button type="button" className="remove-image-btn" onClick={removeImage}>x</button>
            </div>
          )}

          <div className="post-actions-row">
            <input
              ref={fileInputRef}
              className="file-input-hidden"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
            />

            <div className="left-actions">
              <button type="button" className="file-icon-btn" onClick={triggerFilePicker} title="Зураг сонгох">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>
              {imageFile && <span className="image-filename">{imageFile.name}</span>}
            </div>

            <div className="right-actions">
              <span className="char-count">{content.length}/280</span>
              <button type="submit" disabled={(!content.trim() && !imageFile) || posting} className="submit-btn">
                {posting ? 'Илгээж байна...' : 'Пост оруулах'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;