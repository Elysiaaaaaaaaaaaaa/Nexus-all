import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeSlash, Key, User } from '@phosphor-icons/react';
import './Login.css';
import { register, login } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { validateUsername, validateEmail, validatePassword, validateRedirectPath, sanitizeInput } from '../utils/security';
import { rateLimiter } from '../utils/rateLimiter';
import { devBypassRateLimit, devBypassAuth } from '../utils/devMode';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserId, setUserInfo, isAuthenticated } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 如果已登录，重定向到首页（开发模式可绕过）
  useEffect(() => {
    if (isAuthenticated && !devBypassAuth()) {
      const redirect = searchParams.get('redirect');
      const safeRedirect = redirect ? validateRedirectPath(redirect) : null;
      navigate(safeRedirect || '/', { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // 检查锁定状态
  useEffect(() => {
    const checkLockout = () => {
      const username = formData.username.trim().toLowerCase();
      if (!username) return;

      const lockoutStatus = rateLimiter.isLocked(username);
      if (lockoutStatus.locked) {
        setLockoutUntil(lockoutStatus.lockoutUntil);
        const remaining = rateLimiter.getRemainingAttempts(username);
        setRemainingAttempts(remaining);
      } else {
        setLockoutUntil(null);
        const remaining = rateLimiter.getRemainingAttempts(username);
        setRemainingAttempts(remaining);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [formData.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 输入验证和清理
      const username = sanitizeInput(formData.username.trim(), 50);
      const email = isLogin ? null : sanitizeInput(formData.email.trim().toLowerCase(), 254);
      const password = formData.password; // 密码不需要清理，但需要验证

      // 验证用户名
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.message);
        setIsLoading(false);
        return;
      }

      // 验证邮箱（注册时）
      if (!isLogin) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          setError(emailValidation.message);
          setIsLoading(false);
          return;
        }
      }

      // 验证密码
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message);
        setIsLoading(false);
        return;
      }

      // 检查频率限制（开发模式可绕过）
      const rateLimitKey = username.toLowerCase();
      let rateLimitResult = { allowed: true, remaining: 5 };
      
      if (!devBypassRateLimit()) {
        rateLimitResult = rateLimiter.recordAttempt(rateLimitKey);
      }

      if (!rateLimitResult.allowed) {
        if (rateLimitResult.lockoutUntil) {
          const minutes = Math.ceil((rateLimitResult.lockoutUntil - Date.now()) / 60000);
          setError(`登录尝试次数过多，账户已被锁定 ${minutes} 分钟。请稍后再试。`);
          setLockoutUntil(rateLimitResult.lockoutUntil);
        } else {
          setError('登录尝试次数过多，请稍后再试。');
        }
        setIsLoading(false);
        return;
      }

      setRemainingAttempts(rateLimitResult.remaining || 0);

      if (isLogin) {
        // 登录
        const response = await login({
          username,
          password
        });

        // 登录成功，清除尝试记录
        rateLimiter.clearAttempts(rateLimitKey);

        // 保存用户信息和token
        setUserId(response.user.id.toString());
        setUserInfo({
          username: response.user.username,
          email: response.user.email
        });

        // 登录成功后，重定向到之前访问的页面（如果有），否则跳转到首页
        // 验证重定向路径，防止开放重定向攻击
        const redirect = searchParams.get('redirect');
        const safeRedirect = redirect ? validateRedirectPath(redirect) : null;
        navigate(safeRedirect || '/', { replace: true });
      } else {
        // 注册
        if (password !== formData.confirmPassword) {
          setError('两次输入的密码不一致');
          setIsLoading(false);
          return;
        }

        const response = await register({
          username,
          email,
          password
        });

        // 注册成功，清除尝试记录
        rateLimiter.clearAttempts(rateLimitKey);

        // 保存用户信息和token
        setUserId(response.user.id.toString());
        setUserInfo({
          username: response.user.username,
          email: response.user.email
        });

        // 注册成功后，重定向到之前访问的页面（如果有），否则跳转到首页
        // 验证重定向路径，防止开放重定向攻击
        const redirect = searchParams.get('redirect');
        const safeRedirect = redirect ? validateRedirectPath(redirect) : null;
        navigate(safeRedirect || '/', { replace: true });
      }
    } catch (error) {
      // 安全记录错误（不泄露敏感信息）

      // 显示用户友好的错误信息（不泄露系统细节）
      let errorMessage = isLogin ? '登录失败，请检查用户名和密码' : '注册失败，请检查输入信息';

      if (error instanceof Error) {
        // AppError 类型
        if (error.code === 401) {
          errorMessage = '用户名或密码错误';
        } else if (error.code === 400) {
          errorMessage = error.message || '请求参数错误';
        } else if (error.code === 500) {
          errorMessage = '服务器错误，请稍后重试';
        } else if (error.code === 0 || error.code === 504) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error && typeof error === 'object') {
        // 兼容旧格式错误对象
        if (error.status === 401) {
          errorMessage = '用户名或密码错误';
        } else if (error.status === 400) {
          errorMessage = error.message || '请求参数错误';
        } else if (error.status === 500) {
          errorMessage = '服务器错误，请稍后重试';
        } else if (error.status === 0) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
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

          {lockoutUntil && (
            <div className="error-message" style={{ background: 'rgb(254, 226, 226)', borderColor: 'rgb(252, 165, 165)' }}>
              账户已锁定，请在 {Math.ceil((lockoutUntil - Date.now()) / 60000)} 分钟后重试
            </div>
          )}

          {remainingAttempts < 5 && remainingAttempts > 0 && !lockoutUntil && (
            <div style={{ 
              fontSize: '12px', 
              color: 'rgb(239, 68, 68)', 
              marginTop: '-10px', 
              marginBottom: '10px' 
            }}>
              剩余尝试次数: {remainingAttempts}
            </div>
          )}

          <button 
            type="submit" 
            className="login-submit-button" 
            disabled={isLoading || !!lockoutUntil}
          >
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
