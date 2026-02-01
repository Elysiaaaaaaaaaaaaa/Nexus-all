import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Check } from '@phosphor-icons/react';
import './Profile.css';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../services/api';
import defaultAvatar from '../assets/default-avatar.jpg';

const Profile = () => {
  const navigate = useNavigate();
  const { t, logout, userInfo, userId } = useApp();
  const [userName, setUserName] = useState(userInfo?.username || '');
  const [userEmail, setUserEmail] = useState(userInfo?.email || '');
  const [userWorkspace, setUserWorkspace] = useState('专业工作区');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarInputRef = useRef(null);

  const handleSave = () => {
    setIsEditing(false);
    console.log('保存用户信息');
  };

  const handlePickAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 允许重复选择同一文件
    e.target.value = '';

    // 本地预览
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);

    // 尝试上传到后端（若后端未实现/不可用，不影响本地预览）
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      // 添加user_id参数
      formData.append('user_id', userId);
      
      const url = `${API_BASE_URL}/api/user/avatar`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `上传失败(${res.status})`);
      }
      
      const json = await res.json();
      const nextUrl = json?.data?.avatarUrl || json?.data?.url;
      if (nextUrl) {
        // 如果是相对路径，需要加上API_BASE_URL
        const fullUrl = nextUrl.startsWith('http') ? nextUrl : `${API_BASE_URL}${nextUrl}`;
        setAvatarUrl(fullUrl);
      }
    } catch (err) {
      console.warn('头像上传失败，已使用本地预览：', err);
      // 可以在这里添加用户提示
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <button 
          className="profile-back-button"
          onClick={() => navigate(-1)}
        >
          <X size={20} />
        </button>
        <h1 className="profile-title">{t('profile.title')}</h1>
        {isEditing && (
          <button 
            className="profile-save-button"
            onClick={handleSave}
          >
            <Check size={18} weight="bold" />
            {t('profile.save')}
          </button>
        )}
      </header>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div className="profile-avatar" aria-label="用户头像">
              <img 
                className="profile-avatar-image" 
                src={avatarUrl || userInfo?.avatar || defaultAvatar} 
                alt="avatar" 
              />
            </div>
            <button
              type="button"
              className="profile-avatar-edit"
              onClick={handlePickAvatar}
              title={t('profile.uploadAvatar')}
              aria-label={t('profile.uploadAvatar')}
            >
              <Camera size={16} />
            </button>
          </div>
          <h2 className="profile-name">{userName}</h2>
          <p className="profile-email">{userEmail}</p>
        </div>

        <div className="profile-form-section">
          <div className="profile-form-group">
            <label className="profile-form-label">{t('profile.username')}</label>
            {isEditing ? (
              <input
                type="text"
                className="profile-form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            ) : (
              <div className="profile-form-value">{userName}</div>
            )}
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">{t('profile.email')}</label>
            {isEditing ? (
              <input
                type="email"
                className="profile-form-input"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            ) : (
              <div className="profile-form-value">{userEmail}</div>
            )}
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">{t('profile.workspace')}</label>
            {isEditing ? (
              <input
                type="text"
                className="profile-form-input"
                value={userWorkspace}
                onChange={(e) => setUserWorkspace(e.target.value)}
              />
            ) : (
              <div className="profile-form-value">{userWorkspace}</div>
            )}
          </div>

          {!isEditing && (
            <button
              className="profile-edit-button"
              onClick={() => setIsEditing(true)}
            >
              {t('profile.edit')}
            </button>
          )}
        </div>

        <div className="profile-actions">
          <button
            className="profile-logout-button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
