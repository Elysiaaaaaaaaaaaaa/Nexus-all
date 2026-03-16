import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, Key, User, X } from '@phosphor-icons/react';
import './LoginModal.css';
import { register, login } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { validateUsername, validateEmail, validatePassword, sanitizeInput, safeLog } from '../utils/security';
import { rateLimiter } from '../utils/rateLimiter';
import { devBypassRateLimit } from '../utils/devMode';
import { isProduction } from '../utils/security';

// 常量定义
const DEFAULT_REMAINING_ATTEMPTS = 5;
const LOCKOUT_CHECK_INTERVAL = 1000; // 1秒
const MAX_USERNAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;

/**
 * 登录模态框组件
 * @param {boolean} isOpen - 是否显示模态框
 * @param {Function} onClose - 关闭回调函数
 * @param {Function} onSuccess - 登录成功回调函数（可选）
 */
const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { setUserId, setUserInfo, isAuthenticated } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(DEFAULT_REMAINING_ATTEMPTS);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 使用 ref 存储回调函数，避免 useEffect 依赖问题
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onCloseRef.current = onClose;
    onSuccessRef.current = onSuccess;
  }, [onClose, onSuccess]);

  // 如果已登录，关闭模态框
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onCloseRef.current?.();
      onSuccessRef.current?.();
    }
  }, [isAuthenticated, isOpen]);

  // 检查锁定状态
  useEffect(() => {
    const username = formData.username.trim().toLowerCase();
    if (!username) {
      setLockoutUntil(null);
      setRemainingAttempts(DEFAULT_REMAINING_ATTEMPTS);
      return;
    }

    const checkLockout = () => {
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
    const interval = setInterval(checkLockout, LOCKOUT_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [formData.username]);

  // 关闭模态框时重置表单
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setError('');
      setIsLogin(true);
      setShowPassword(false);
      setLockoutUntil(null);
      setRemainingAttempts(DEFAULT_REMAINING_ATTEMPTS);
      setIsLoading(false);
    }
  }, [isOpen]);

  // ESC 键关闭模态框
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * 处理表单提交
   * 安全措施：
   * 1. 所有输入都经过验证和清理（防止XSS）
   * 2. 使用频率限制器防止暴力破解
   * 3. 密码不记录到日志
   * 4. 使用原有的安全API封装（register/login函数已包含验证）
   * 5. 错误信息不泄露敏感信息
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ========== 安全验证层 ==========
      // 第一层：输入清理（防止XSS攻击）
      // 注意：密码不清理，直接传递给API（API层会处理加密和验证）
      const username = sanitizeInput(formData.username.trim(), MAX_USERNAME_LENGTH);
      const email = isLogin ? null : sanitizeInput(formData.email.trim().toLowerCase(), MAX_EMAIL_LENGTH);
      const password = formData.password; // 密码不清理，但会经过验证

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

      // 检查频率限制（防止暴力破解攻击）
      // 使用用户名作为key，防止同一用户频繁尝试
      const rateLimitKey = username.toLowerCase();
      let rateLimitResult = { allowed: true, remaining: DEFAULT_REMAINING_ATTEMPTS };
      
      // 开发模式可绕过（仅用于开发测试）
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
        // 登录 - 使用原有的安全API封装
        // API层已经包含输入验证和清理，这里再次验证是为了提前反馈
        const response = await login({
          username, // 已通过sanitizeInput清理
          password  // 密码不清理，直接传递给API（API层会处理）
        });

        // 登录成功，清除尝试记录（防止误锁）
        rateLimiter.clearAttempts(rateLimitKey);

        // 保存用户信息和token
        // 注意：token由API层自动保存到localStorage（api.js中的register/login函数）
        // 这里只保存用户信息到Context
        if (response?.user) {
          setUserId(response.user.id?.toString() || '');
          setUserInfo({
            username: response.user.username || '',
            email: response.user.email || ''
          });
        }

        // 关闭模态框并跳转
        onCloseRef.current?.();
        if (onSuccessRef.current) {
          onSuccessRef.current();
        } else {
          navigate('/dashboard');
        }
      } else {
        // 注册
        if (password !== formData.confirmPassword) {
          setError('两次输入的密码不一致');
          setIsLoading(false);
          return;
        }

        // 注册 - 使用原有的安全API封装
        // API层已经包含输入验证和清理，这里再次验证是为了提前反馈
        const response = await register({
          username, // 已通过sanitizeInput清理
          email,    // 已通过sanitizeInput清理
          password  // 密码不清理，直接传递给API（API层会处理）
        });

        // 注册成功，清除尝试记录（防止误锁）
        rateLimiter.clearAttempts(rateLimitKey);

        // 保存用户信息和token
        // 注意：token由API层自动保存到localStorage（api.js中的register/login函数）
        // 这里只保存用户信息到Context
        if (response?.user) {
          setUserId(response.user.id?.toString() || '');
          setUserInfo({
            username: response.user.username || '',
            email: response.user.email || ''
          });
        }

        // 关闭模态框并跳转
        onCloseRef.current?.();
        if (onSuccessRef.current) {
          onSuccessRef.current();
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      // 安全记录错误（不泄露敏感信息，特别是密码）
      // 注意：绝不记录密码或敏感信息
      safeLog('登录/注册错误', {
        type: isLogin ? 'login' : 'register',
        username: formData.username ? '***' : undefined, // 不记录实际用户名
        hasError: !!error,
        errorCode: error?.code || error?.status
      });

      // 提取错误处理逻辑
      const errorMessage = getErrorMessage(error, isLogin);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 提取错误信息，提供用户友好的错误提示
   * 安全措施：
   * 1. 不泄露系统内部信息（如堆栈、数据库结构等）
   * 2. 不泄露API端点详情
   * 3. 统一错误消息格式，防止信息泄露
   * @param {Error|Object} error - 错误对象
   * @param {boolean} isLogin - 是否为登录操作
   * @returns {string} 用户友好的错误信息
   */
  const getErrorMessage = useCallback((error, isLogin) => {
    const defaultMessage = isLogin ? '登录失败，请检查用户名和密码' : '注册失败，请检查输入信息';

    if (!error) {
      return defaultMessage;
    }

    // AppError 类型（新格式）- 由http.js拦截器统一处理
    if (error instanceof Error) {
      if (error.code === 401) {
        // 401统一返回通用消息，不泄露是用户名还是密码错误
        return '用户名或密码错误';
      } else if (error.code === 400) {
        // 400错误可能包含用户输入问题，但需要清理
        const message = error.message || '请求参数错误';
        // 确保错误消息不包含敏感信息
        return sanitizeInput(message, 200);
      } else if (error.code === 500) {
        return '服务器错误，请稍后重试';
      } else if (error.code === 0 || error.code === 504) {
        return '网络连接失败，请检查网络设置';
      } else if (error.message) {
        // 清理错误消息，防止XSS
        return sanitizeInput(error.message, 200);
      }
    }
    
    // 兼容旧格式错误对象
    if (error && typeof error === 'object') {
      if (error.status === 401) {
        return '用户名或密码错误';
      } else if (error.status === 400) {
        const message = error.message || '请求参数错误';
        return sanitizeInput(message, 200);
      } else if (error.status === 500) {
        return '服务器错误，请稍后重试';
      } else if (error.status === 0) {
        return '网络连接失败，请检查网络设置';
      } else if (error.message) {
        return sanitizeInput(error.message, 200);
      }
    }

    return defaultMessage;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleClose = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const handleOverlayClick = useCallback((e) => {
    // 只有点击遮罩层本身时才关闭，点击内容区域不关闭
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          className="login-modal-close" 
          onClick={handleClose} 
          aria-label="关闭"
          type="button"
        >
          <X size={20} weight="bold" />
        </button>
        
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
    </div>
  );
};

export default LoginModal;
