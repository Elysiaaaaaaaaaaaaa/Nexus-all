import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { validateRedirectPath } from '../utils/security';
import { devBypassAuth } from '../utils/devMode';

/**
 * 受保护的路由组件
 * 检查用户是否已登录，如果没有则重定向到登录页面
 * 参考 mingcha-wanxiang-frontend 的路由保护逻辑
 * 增强安全防护：验证重定向路径、防止开放重定向攻击
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useApp();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 短暂延迟以确保状态已更新
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 安全获取 Token（防止 AppContext 未初始化）
  let token = '';
  try {
    token = localStorage.getItem('auth_token') || '';
  } catch {
    // localStorage 不可用时，使用 AppContext
    token = '';
  }

  // 检查 Token 是否存在且不为空字符串
  const hasValidToken = !!token && token.trim() !== '';
  
  // 检查用户是否已登录（同时检查 token 和 userInfo）
  const isUserAuthenticated = hasValidToken && isAuthenticated;

  // 开发模式：检查是否启用路由保护绕过
  const devBypass = devBypassAuth();

  // 加载中状态
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 开发模式绕过认证检查
  if (devBypass) {
    return children;
  }

  // 如果未登录，重定向到登录页，并携带来源路径
  if (!isUserAuthenticated) {
    // 如果已经在登录页或首页，就不要再重定向了，防止死循环
    if (location.pathname === '/login' || location.pathname === '/' || location.pathname === '/homepage') {
      return children;
    }

    // 验证并清理重定向路径，防止开放重定向攻击
    const redirectPath = validateRedirectPath(location.pathname);
    const search = location.search ? `?redirect=${encodeURIComponent(redirectPath || '/')}` : '';

    // 执行重定向，并携带来源路径
    return (
      <Navigate
        to={{
          pathname: '/login',
          search,
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
