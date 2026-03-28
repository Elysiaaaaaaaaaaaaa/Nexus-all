import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  FlowArrow,
  ClockCounterClockwise,
  UserCircle,
  DotsThreeOutline,
} from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import './MobileLayout.css';

/** 底部「更多」Tab 高亮：子页面从聚合页进入后仍视为「更多」分组 */
function pathBelongsToMoreHub(pathname) {
  if (pathname === '/more') return true;
  if (
    pathname === '/dashboard' ||
    pathname === '/workflows' ||
    pathname.startsWith('/interaction') ||
    pathname === '/history' ||
    pathname.startsWith('/history/') ||
    pathname === '/profile'
  ) {
    return false;
  }
  const bases = [
    '/manual',
    '/settings',
    '/agents',
    '/projects',
    '/analytics',
    '/video-generation',
    '/ui-design',
    '/image-generation',
    '/audio-processing',
    '/assets',
    '/lab',
    '/export',
    '/security',
    '/example',
    '/tech-showcase',
    '/competition-showcase',
    '/team',
    '/acps-board',
  ];
  if (bases.some((b) => pathname === b || pathname.startsWith(`${b}/`))) return true;
  if (pathname.startsWith('/agent/') || pathname.startsWith('/project/')) return true;
  return false;
}

/**
 * 原生 App（Capacitor）专用壳：底部 Tab + 安全区，与 Web 侧栏 Layout 分离
 * @param {{ children: React.ReactNode; hideTabBar?: boolean; title?: string; titleI18nKey?: string; showBack?: boolean; onBack?: () => void }} props
 */
const MobileLayout = ({
  children,
  hideTabBar = false,
  title,
  titleI18nKey,
  showBack = false,
  onBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useApp();

  const resolvedTitle = titleI18nKey ? t(titleI18nKey) : title;

  const tabs = useMemo(
    () => [
      { path: '/dashboard', label: t('nav.dashboard'), icon: SquaresFour },
      { path: '/workflows', label: t('nav.mobileTabWorkflows'), icon: FlowArrow },
      { path: '/history', label: t('nav.history'), icon: ClockCounterClockwise },
      { path: '/profile', label: t('profile.title') || '我的', icon: UserCircle },
      { path: '/more', label: t('nav.mobileMore'), icon: DotsThreeOutline },
    ],
    [t],
  );

  const showHeader = Boolean(resolvedTitle) || showBack;

  return (
    <div className="mobile-shell">
      {showHeader && (
        <header className="mobile-shell-header">
          {showBack ? (
            <button
              type="button"
              className="mobile-shell-header-back"
              onClick={onBack || (() => navigate(-1))}
              aria-label={t('nav.back')}
            >
              ←
            </button>
          ) : (
            <span className="mobile-shell-header-spacer" aria-hidden />
          )}
          {resolvedTitle ? (
            <h1 className="mobile-shell-header-title">{resolvedTitle}</h1>
          ) : (
            <span />
          )}
          <span className="mobile-shell-header-spacer" aria-hidden />
        </header>
      )}
      <div className="mobile-shell-main">
        <div className="mobile-shell-body">{children}</div>
        {!hideTabBar && (
          <nav className="mobile-tabbar" aria-label="主导航">
            {tabs.map((tab) => {
              const { path, label } = tab;
              const TabIcon = tab.icon;
              const active =
                path === '/more'
                  ? pathBelongsToMoreHub(location.pathname)
                  : location.pathname === path ||
                    (path !== '/dashboard' && path !== '/more' && location.pathname.startsWith(`${path}/`)) ||
                    (path === '/workflows' && location.pathname.startsWith('/interaction'));
              const tabAria =
                path === '/workflows' ? `${label}，${t('nav.mobileTabWorkflowsA11y')}` : label;
              return (
                <button
                  key={path}
                  type="button"
                  className={`mobile-tab ${active ? 'active' : ''}`}
                  onClick={() => navigate(path)}
                  aria-label={tabAria}
                >
                  <span className="mobile-tab-icon">
                    <TabIcon size={22} weight={active ? 'fill' : 'regular'} />
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default MobileLayout;
