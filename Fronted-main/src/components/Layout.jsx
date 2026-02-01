import React, { useState, useEffect } from 'react';
import { PlusCircle, SquaresFour, ClockCounterClockwise, Gear, BookOpen, Archive, FlowArrow, Flask, DownloadSimple, ShieldCheck } from '@phosphor-icons/react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import logoTransparent from '../assets/logo_transparent.png';
import defaultAvatar from '../assets/default-avatar.jpg';
import { useApp } from '../contexts/AppContext';
import './Layout.css';

const Layout = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, userInfo } = useApp();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setOpacity(1);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navItems = [
    { icon: <SquaresFour />, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: <Archive />, label: t('nav.assets'), path: '/assets' },
    { icon: <FlowArrow />, label: t('nav.workflows'), path: '/workflows' },
    { icon: <Flask />, label: t('nav.lab'), path: '/lab' },
    { icon: <DownloadSimple />, label: t('nav.export'), path: '/export' },
    { icon: <ShieldCheck />, label: t('security.title'), path: '/security' },
    { icon: <ClockCounterClockwise />, label: t('nav.history'), path: '/history' },
    { icon: <BookOpen />, label: t('nav.manual'), path: '/manual' },
  ];

  return (
    <div className="layout-container">
      {/* 动态网格背景 */}
      <div className="bg-grid-pattern"></div>

      {/* 聚光灯效果 */}
      <div
        className="spotlight"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          opacity: opacity
        }}
      ></div>

      {/* 侧边栏 */}
      <aside className="sidebar">
        <div 
          className="sidebar-header" 
          onClick={() => navigate('/homepage')} 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/homepage');
            }
          }}
        >
          <div className="logo-container">
            <img src={logoTransparent} alt="Nexus" className="logo-image" />
          </div>
          <span className="logo-text">Nexus</span>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => navigate('/dashboard')}
            className="create-button"
          >
            <PlusCircle weight="bold" size={18} className="create-button-icon" />
            <span className="create-button-text">{t('nav.createProject')}</span>
          </button>

          <div className="nav-spacer"></div>

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-item-icon">
                {React.cloneElement(item.icon, { weight: location.pathname === item.path ? "fill" : "regular" })}
              </span>
              <span className="nav-item-text">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* 底部用户及设置区 */}
        <div className="sidebar-footer">
          <Link
            to="/settings"
            className={`settings-link ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Gear size={18} weight={location.pathname === '/settings' ? "fill" : "regular"} />
            <span className="settings-link-text">{t('nav.settings')}</span>
          </Link>

          <div 
            className="user-profile"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              <div className="user-avatar-circle">
                <img src={userInfo?.avatar || defaultAvatar} alt="Avatar" className="user-avatar-image" />
              </div>
              <div className="user-status"></div>
            </div>
            <div className="user-info">
              <p className="user-name">{userInfo?.username || 'User'}</p>
              <p className="user-workspace">{userInfo?.workspace || '工作区'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;