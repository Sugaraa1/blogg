import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import './Profile.css';

function Profile({ user, onLogout, updateUser }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ bio: '' });
  const [activeTab, setActiveTab] = useState('posts');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageType, setImageType] = useState(''); // 'avatar' or 'cover'
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = user.username === username;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [username]);

  useEffect(() => {
    if (profile && !isOwnProfile) {
      checkFollowStatus();
    }
  }, [profile, isOwnProfile]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${username}`);
      setProfile(response.data);
      setEditData({
        bio: response.data.bio || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Profile татахад алдаа:', error);
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${username}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Постууд татахад алдаа:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!profile) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/users/${profile._id}/follow-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Follow статус шалгахад алдаа:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/users/${profile._id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(response.data.isFollowing);
      fetchProfile();
    } catch (error) {
      console.error('Follow хийхэд алдаа:', error);
      alert('Follow хийхэд алдаа гарлаа');
    }
  };

  const handleSaveBio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        { bio: editData.bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
      setEditMode(false);
      
      // App.js-ийн user state шинэчлэх
      if (updateUser && isOwnProfile) {
        updateUser({
          ...user,
          bio: response.data.bio
        });
      }
      
      alert('Bio амжилттай хадгалагдлаа!');
    } catch (error) {
      console.error('Bio засварлахад алдаа:', error);
      alert('Bio хадгалахад алдаа гарлаа: ' + (error.response?.data?.message || error.message));
    }
  };

  const openImageModal = (type) => {
    setImageType(type);
    setImageUrl(type === 'avatar' ? (profile.avatar || '') : (profile.coverImage || ''));
    setShowImageModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Зургийн хэмжээ шалгах (5MB-аас бага байх ёстой)
    if (file.size > 5 * 1024 * 1024) {
      alert('Зургийн хэмжээ 5MB-аас бага байх ёстой');
      return;
    }

    setUploading(true);

    // File-ийг base64 болгох
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      
      try {
        const token = localStorage.getItem('token');
        const updateData = imageType === 'avatar' 
          ? { avatar: base64String }
          : { coverImage: base64String };
        
        const response = await axios.put(
          'http://localhost:5000/api/users/profile',
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProfile(response.data);
        setShowImageModal(false);
        setUploading(false);
        
        // App.js-ийн user state шинэчлэх
        if (updateUser && isOwnProfile) {
          updateUser({
            ...user,
            avatar: response.data.avatar,
            coverImage: response.data.coverImage
          });
        }
        
        alert('Зураг амжилттай солигдлоо!');
      } catch (error) {
        console.error('Зураг upload хийхэд алдаа:', error);
        alert('Зураг upload хийхэд алдаа гарлаа: ' + (error.response?.data?.message || error.message));
        setUploading(false);
      }
    };
    
    reader.onerror = () => {
      alert('Файл уншихад алдаа гарлаа');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleImageUrlSave = async () => {
    if (!imageUrl.trim()) {
      alert('Зургийн URL оруулна уу');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = imageType === 'avatar' 
        ? { avatar: imageUrl }
        : { coverImage: imageUrl };
      
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProfile(response.data);
      setShowImageModal(false);
      setUploading(false);
      
      // App.js-ийн user state шинэчлэх
      if (updateUser && isOwnProfile) {
        updateUser({
          ...user,
          avatar: response.data.avatar,
          coverImage: response.data.coverImage
        });
      }
      
      alert('Зураг амжилттай солигдлоо!');
    } catch (error) {
      console.error('Зураг хадгалахад алдаа:', error);
      alert('Зураг хадгалахад алдаа гарлаа: ' + (error.response?.data?.message || error.message));
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getUserComments = () => {
    const allComments = [];
    posts.forEach(post => {
      if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
          if (comment.user && comment.user._id === profile._id) {
            allComments.push({
              ...comment,
              postContent: post.content,
              postId: post._id,
              postAuthor: post.author
            });
          }
        });
      }
    });
    return allComments;
  };

  if (loading) {
    return (
      <div className="home-layout">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="home-layout">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="error">Хэрэглэгч олдсонгүй</div>
        </div>
      </div>
    );
  }

  const userComments = getUserComments();

  return (
    <div className="home-layout">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="main-content">
        <div className="content-header">
          <h2>{profile.displayName}</h2>
        </div>
        
        <div className="profile-container">
          {/* Нүүр зураг */}
          <div className="profile-cover">
            {profile.coverImage ? (
              <img src={profile.coverImage} alt="Cover" />
            ) : (
              <div className="cover-placeholder"></div>
            )}
            {isOwnProfile && (
              <button 
                className="edit-cover-btn"
                onClick={() => openImageModal('cover')}
                title="Нүүр зураг солих"
              >
                📷
              </button>
            )}
          </div>

          {/* Profile мэдээлэл */}
          <div className="profile-info-section">
            <div className="profile-avatar-container">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.displayName} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(profile.displayName)}
                </div>
              )}
              {isOwnProfile && (
                <button 
                  className="edit-avatar-btn"
                  onClick={() => openImageModal('avatar')}
                  title="Profile зураг солих"
                >
                  📷
                </button>
              )}
            </div>

            <div className="profile-actions">
              {isOwnProfile ? (
                <button 
                  className="edit-profile-btn"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Болих' : 'Profile засах'}
                </button>
              ) : (
                <button 
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Дагаж байна' : 'Дагах'}
                </button>
              )}
            </div>

            <div className="profile-details">
              <h2>{profile.displayName}</h2>
              <p className="username-text">@{profile.username}</p>
              
              {editMode ? (
                <div className="edit-profile-form">
                  <textarea
                    placeholder="Bio бичих (160 тэмдэгт)"
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    maxLength={160}
                  />
                  <button onClick={handleSaveBio} className="save-btn">
                    Хадгалах
                  </button>
                </div>
              ) : (
                profile.bio && <p className="bio-text">{profile.bio}</p>
              )}

              <div className="profile-stats">
                <div className="stat">
                  <strong>{profile.following?.length || 0}</strong>
                  <span>Дагаж байгаа</span>
                </div>
                <div className="stat">
                  <strong>{profile.followers?.length || 0}</strong>
                  <span>Дагагч</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Постууд
            </button>
            <button
              className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Хариултууд
            </button>
          </div>

          {/* Content */}
          <div className="profile-content">
            {activeTab === 'posts' && (
              <div className="posts-list">
                {posts.length === 0 ? (
                  <div className="empty-state">
                    <p>Пост байхгүй байна</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <Post key={post._id} post={post} currentUser={user} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="comments-list">
                {userComments.length === 0 ? (
                  <div className="empty-state">
                    <p>Хариулт байхгүй байна</p>
                  </div>
                ) : (
                  userComments.map((comment, index) => (
                    <div key={index} className="comment-item">
                      <div className="comment-header">
                        <span className="replied-to">
                          @{comment.postAuthor?.username}-д хариулсан
                        </span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                      <p className="original-post">"{comment.postContent}"</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{imageType === 'avatar' ? 'Profile зураг солих' : 'Нүүр зураг солих'}</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowImageModal(false)}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {uploading ? (
                <div className="uploading-state">
                  <div className="spinner"></div>
                  <p>Зураг upload хийж байна...</p>
                </div>
              ) : (
                <>
                  <div className="upload-section">
                    <label className="upload-btn">
                      📁 Компьютероос сонгох
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    
                    <div className="divider">
                      <span>эсвэл</span>
                    </div>
                    
                    <div className="url-section">
                      <input
                        type="text"
                        placeholder="Зургийн URL оруулах (жишээ: https://i.imgur.com/abc.jpg)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <button 
                        className="url-save-btn"
                        onClick={handleImageUrlSave}
                        disabled={!imageUrl.trim()}
                      >
                        Хадгалах
                      </button>
                    </div>
                  </div>
                  
                  {imageUrl && (
                    <div className="image-preview">
                      <p>Урьдчилан үзэх:</p>
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }} 
                      />
                      <p style={{ display: 'none', color: 'var(--text-secondary)', marginTop: '10px' }}>
                        Зураг ачаалагдсангүй. URL-ээ шалгана уу.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;