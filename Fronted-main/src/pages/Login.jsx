import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, Key, User } from '@phosphor-icons/react';
import './Login.css';
import { authAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';

const Login = () => {
  const navigate = useNavigate();
  const { setUserId, setUserInfo } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // 登录
        const response = await authAPI.login(
          formData.username,
          formData.password
        );

        // 保存用户信息和token
        setUserId(response.user.id.toString());
        setUserInfo({
          username: response.user.username,
          email: response.user.email
        });

        navigate('/');
      } else {
        // 注册
        if (formData.password !== formData.confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }

        const response = await authAPI.register(
          formData.username,
          formData.email,
          formData.password
        );

        // 保存用户信息和token
        setUserId(response.user.id.toString());
        setUserInfo({
          username: response.user.username,
          email: response.user.email
        });

        navigate('/');
      }
    } catch (error) {
      setError(error.message || (isLogin ? '登录失败' : '注册失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{isLogin ? '登录' : '注册'}</h1>
          <p className="login-subtitle">
            {isLogin ? '欢迎回到 Nexus' : '创建您的 Nexus 账户'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <div className="form-input-wrapper">
                <User className="form-input-icon" size={16} />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">用户名</label>
            <div className="form-input-wrapper">
              <User className="form-input-icon" size={16} />
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <div className="form-input-wrapper">
              <Key className="form-input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">确认密码</label>
              <div className="form-input-wrapper">
                <Key className="form-input-icon" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="login-submit-button" disabled={isLoading}>
            {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="login-footer">
          <button
            className="login-switch-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? '还没有账户？立即注册' : '已有账户？立即登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
