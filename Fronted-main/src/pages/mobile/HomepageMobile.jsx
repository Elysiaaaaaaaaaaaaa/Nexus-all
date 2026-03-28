import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoTransparent from '../../assets/logo_transparent.png';
import { useApp } from '../../contexts/AppContext';
import { getRuntimeChannelI18nKey } from '../../utils/runtimePlatform';
import './HomepageMobile.css';

/**
 * 原生壳内落地页：单列、大按钮、无 Windows 下载；与 Web Homepage 内容分离
 */
const HomepageMobile = () => {
  const navigate = useNavigate();
  const { t, language, safeIsAuthenticated } = useApp();
  const goApp = () => {
    if (safeIsAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="homepage-mobile">
      <header className="homepage-mobile-top">
        <img src={logoTransparent} alt="Nexus" className="homepage-mobile-logo" />
        <div>
          <div className="homepage-mobile-brand">NEXUS</div>
          <div className="homepage-mobile-channel">
            {t(`homepage.${getRuntimeChannelI18nKey()}`)}
          </div>
        </div>
      </header>

      <section className="homepage-mobile-hero">
        <h1 className="homepage-mobile-title">
          {t('dashboard.headlineMain')}{' '}
          <span className="homepage-mobile-highlight">{t('dashboard.headlineHighlight')}</span>{' '}
          {t('dashboard.headlineTail')}
        </h1>
        <p className="homepage-mobile-tagline">{t('homepage.heroTagline')}</p>
        {language === 'zh-CN' && (
          <p className="homepage-mobile-desc">
            基于 LangGraph 与 ACPs，创意快速变为视频
          </p>
        )}
        {language === 'en-US' && (
          <p className="homepage-mobile-desc">
            LangGraph & ACPs — ideas to video, fast
          </p>
        )}
        {language !== 'zh-CN' && language !== 'en-US' && (
          <p className="homepage-mobile-desc">{t('homepage.heroDescription')}</p>
        )}
      </section>

      <div className="homepage-mobile-actions">
        <button type="button" className="homepage-mobile-btn primary" onClick={goApp}>
          {safeIsAuthenticated ? t('homepage.startCreate') : t('homepage.tryFree')}
        </button>
        <button
          type="button"
          className="homepage-mobile-btn secondary"
          onClick={() => navigate('/manual')}
        >
          {t('homepage.docs')}
        </button>
        {safeIsAuthenticated && (
          <button
            type="button"
            className="homepage-mobile-btn ghost"
            onClick={() => navigate('/more')}
          >
            {t('moreHub.pageTitle')}
          </button>
        )}
      </div>

      <p className="homepage-mobile-interaction-hint">{t('homepage.mobileWhereInteraction')}</p>

    </div>
  );
};

export default HomepageMobile;
