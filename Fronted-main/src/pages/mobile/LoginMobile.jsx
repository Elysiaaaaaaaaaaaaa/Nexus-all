import React from 'react';
import Login from '../Login.jsx';
import './LoginMobile.css';

/**
 * 原生壳内登录：独立样式层，与 Web Login 逻辑复用（见 Login.jsx）
 */
const LoginMobile = () => (
  <div className="login-mobile-page">
    <Login />
  </div>
);

export default LoginMobile;
