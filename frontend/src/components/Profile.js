import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Post from './Post';
import ProfileActions from './ProfileActions'; // 🆕 НЭМСЭН
import './Profile.css';

function Profile({ user, onLogout, updateUser }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false); // 🆕 НЭМСЭН
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ bio: '' });
  const [activeTab, setActiveTab] = useState('posts');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageType, setImageType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false); 
  const [followingStates, setFollowingStates] = useState({});

  const isOwnProfile = user.username === username;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [username]);

  useEffect(() => {
    if (profile && !isOwnProfile) {
      checkFollowStatus();
      checkBlockStatus(); // 🆕 НЭМСЭН
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

  // 🆕 НЭМСЭН - Block статус шалгах
  const checkBlockStatus = async () => {
    if (!profile) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/users/${profile._id}/block-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsBlocked(response.data.isBlocked);
    } catch (error) {
      console.error('Block статус шалгахад алдаа:', error);
    }
  };

  // 🆕 НЭМСЭН - Block хийх
  const handleBlock = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/users/${profile._id}/block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsBlocked(response.data.isBlocked);
      alert(response.data.message);
      fetchProfile();
    } catch (error) {
      console.error('Block хийхэд алдаа:', error);
      alert('Block хийхэд алдаа гарлаа');
    }
  };

  const handleFollowFromModal = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowingStates(prev => ({
        ...prev,
        [userId]: response.data.isFollowing
      }));
      fetchProfile();
    } catch (error) {
      console.error('Follow хийхэд алдаа:', error);
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
      
      if (updateUser && user.id !== profile._id) {
        const updatedUser = await axios.get(`http://localhost:5000/api/users/${user.username}`);
        updateUser({
          ...user,
          following: updatedUser.data.following,
          followers: updatedUser.data.followers
        });
      }
      
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

    if (file.size > 5 * 1024 * 1024) {
      alert('Зургийн хэмжээ 5MB-аас бага байх ёстой');
      return;
    }

    setUploading(true);

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

  const handlePostUpdate = (updatedPost) => {
    if (updatedPost === null) {
      fetchUserPosts();
    }
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
                <>
                  <button 
                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Дагаж байна' : 'Дагах'}
                  </button>
                  {/* 🆕 НЭМСЭН - Block болон Report товчнууд follow хажууд */}
                  <ProfileActions
                    profileUser={profile}
                    currentUser={user}
                    isBlocked={isBlocked}
                    onBlock={handleBlock}
                    onReport={() => fetchProfile()}
                  />
                </>
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
                <div 
                  className="stat clickable" 
                  onClick={() => setShowFollowingModal(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{profile.following?.length || 0}</strong>
                  <span>Дагаж байгаа</span>
                </div>
                <div 
                  className="stat clickable" 
                  onClick={() => setShowFollowersModal(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{profile.followers?.length || 0}</strong>
                  <span>Дагагч</span>
                </div>
                {isOwnProfile && (
                  <div 
                    className="stat clickable" 
                    onClick={() => setShowBlockedModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <strong>{profile.blockedUsers?.length || 0}</strong>
                    <span>Blocked</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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

          <div className="profile-content">
            {activeTab === 'posts' && (
              <div className="posts-list">
                {posts.length === 0 ? (
                  <div className="empty-state">
                    <p>Пост байхгүй байна</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <Post key={post._id} post={post} currentUser={user} onPostUpdate={handlePostUpdate} />
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

      {showFollowersModal && profile && (
        <div className="modal-overlay" onClick={() => setShowFollowersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Дагагчид</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFollowersModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="users-list">
              {profile.followers && profile.followers.length > 0 ? (
                profile.followers.map(follower => (
                  <div key={follower._id} className="user-list-item">
                    <div 
                      className="user-list-left"
                      onClick={() => navigate(`/profile/${follower.username}`)}
                    >
                      {follower.avatar ? (
                        <img 
                          src={follower.avatar} 
                          alt={follower.displayName}
                          className="user-list-avatar"
                        />
                      ) : (
                        <div className="user-list-avatar placeholder">
                          {follower.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="user-list-info">
                        <p className="user-list-name">{follower.displayName || follower.username}</p>
                        <p className="user-list-handle">@{follower.username}</p>
                      </div>
                    </div>
                    {!isOwnProfile && follower._id !== user.id && (
                      <button
                        className={`follow-btn-small ${followingStates[follower._id] ? 'following' : ''}`}
                        onClick={() => handleFollowFromModal(follower._id)}
                      >
                        {followingStates[follower._id] ? 'Дагаж байна' : 'Дагах'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-list">Дагагч байхгүй байна</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showFollowingModal && profile && (
        <div className="modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Дагаж байгаа хүмүүс</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFollowingModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="users-list">
              {profile.following && profile.following.length > 0 ? (
                profile.following.map(followee => (
                  <div key={followee._id} className="user-list-item">
                    <div 
                      className="user-list-left"
                      onClick={() => navigate(`/profile/${followee.username}`)}
                    >
                      {followee.avatar ? (
                        <img 
                          src={followee.avatar} 
                          alt={followee.displayName}
                          className="user-list-avatar"
                        />
                      ) : (
                        <div className="user-list-avatar placeholder">
                          {followee.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="user-list-info">
                        <p className="user-list-name">{followee.displayName || followee.username}</p>
                        <p className="user-list-handle">@{followee.username}</p>
                      </div>
                    </div>
                    {!isOwnProfile && followee._id !== user.id && (
                      <button
                        className={`follow-btn-small ${followingStates[followee._id] ? 'following' : ''}`}
                        onClick={() => handleFollowFromModal(followee._id)}
                      >
                        {followingStates[followee._id] ? 'Дагаж байна' : 'Дагах'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-list">Дагаж байгаа хүмүүс байхгүй байна</p>
              )}
            </div>
          </div>
        </div>
      )}
    {/* 🆕 Blocked Users Modal */}
      {showBlockedModal && profile && isOwnProfile && (
        <div className="modal-overlay" onClick={() => setShowBlockedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Blocked хэрэглэгчид</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBlockedModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="users-list">
              {profile.blockedUsers && profile.blockedUsers.length > 0 ? (
                profile.blockedUsers.map(blockedUser => (
                  <div key={blockedUser._id} className="user-list-item">
                    <div 
                      className="user-list-left"
                      onClick={() => navigate(`/profile/${blockedUser.username}`)}
                    >
                      {blockedUser.avatar ? (
                        <img 
                          src={blockedUser.avatar} 
                          alt={blockedUser.displayName}
                          className="user-list-avatar"
                        />
                      ) : (
                        <div className="user-list-avatar placeholder">
                          {blockedUser.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="user-list-info">
                        <p className="user-list-name">{blockedUser.displayName || blockedUser.username}</p>
                        <p className="user-list-handle">@{blockedUser.username}</p>
                      </div>
                    </div>
                    <button
                      className="unblock-btn-small"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(
                            `http://localhost:5000/api/users/${blockedUser._id}/block`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          fetchProfile();
                        } catch (error) {
                          console.error('Unblock хийхэд алдаа:', error);
                        }
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-list">Blocked хэрэглэгч байхгүй байна</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    
    
  );
}


export default Profile;