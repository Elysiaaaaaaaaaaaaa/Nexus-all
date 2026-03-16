import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Check } from '@phosphor-icons/react';
import './Profile.css';
import { useApp } from '../contexts/AppContext';
import { getUserAvatarUrl } from '../utils/avatar';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const { userInfo } = useApp();
  const [userName, setUserName] = useState(userInfo?.username || '张恒基');
  const [userEmail, setUserEmail] = useState(userInfo?.email || 'zhanghengji@example.com');
  const [userWorkspace, setUserWorkspace] = useState('专业工作区');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarInputRef = useRef(null);

  // 生成默认头像 URL（当没有上传头像时使用）
  const defaultAvatarUrl = useMemo(() => {
    return getUserAvatarUrl(avatarUrl, userName);
  }, [avatarUrl, userName]);

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
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `上传失败(${res.status})`);
      const nextUrl = json?.data?.avatarUrl || json?.data?.url;
      if (nextUrl) setAvatarUrl(nextUrl);
    } catch (err) {
      // 头像上传失败，已使用本地预览
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
                src={defaultAvatarUrl} 
                alt="avatar"
                onError={(e) => {
                  // 如果图片加载失败，显示首字母
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  if (parent && !parent.querySelector('.profile-avatar-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'profile-avatar-fallback';
                    fallback.textContent = userName.charAt(0) || 'U';
                    fallback.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 48px; font-weight: 600; color: white;';
                    parent.appendChild(fallback);
                  }
                }}
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
      </div>
    </div>
  );
};

export default Profile;
