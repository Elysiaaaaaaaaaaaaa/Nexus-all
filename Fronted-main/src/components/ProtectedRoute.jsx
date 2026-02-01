import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

/**
 * 受保护的路由组件
 * 检查用户是否已登录，如果没有则重定向到登录页面
 * 在开发环境中跳过认证检查
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();

  // 在开发环境中跳过认证检查
  if (import.meta.env.DEV) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;