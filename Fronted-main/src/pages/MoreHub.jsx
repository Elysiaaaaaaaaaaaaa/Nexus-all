import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import './MoreHub.css';

/**
 * 聚合入口：移动端底栏「更多」与 Web 侧栏互补，列出主要业务路由
 */
const MoreHub = () => {
  const navigate = useNavigate();
  const { t } = useApp();

  const sections = useMemo(
    () => [
      {
        title: t('moreHub.sectionMain'),
        items: [
          { to: '/dashboard', label: t('nav.dashboard') },
          { to: '/workflows', label: t('nav.workflows') },
          { to: '/history', label: t('nav.history') },
          { to: '/profile', label: t('profile.title') },
        ],
      },
      {
        title: t('moreHub.sectionCreate'),
        items: [
          { to: '/video-generation', label: t('moreHub.linkVideoGen') },
          { to: '/image-generation', label: t('moreHub.linkImageGen') },
          { to: '/audio-processing', label: t('moreHub.linkAudio') },
          { to: '/ui-design', label: t('moreHub.linkUiDesign') },
        ],
      },
      {
        title: t('moreHub.sectionData'),
        items: [
          { to: '/projects', label: t('moreHub.linkProjects') },
          { to: '/assets', label: t('nav.assets') },
          { to: '/agents', label: t('moreHub.linkAgents') },
          { to: '/analytics', label: t('moreHub.linkAnalytics') },
        ],
      },
      {
        title: t('moreHub.sectionPlatform'),
        items: [
          { to: '/lab', label: t('nav.lab') },
          { to: '/export', label: t('nav.export') },
          { to: '/security', label: t('security.title') },
          { to: '/manual', label: t('nav.manual') },
          { to: '/settings', label: t('nav.settings') },
          { to: '/acps-board', label: t('moreHub.linkAcpsBoard') },
        ],
      },
      {
        title: t('moreHub.sectionShowcase'),
        items: [
          { to: '/example', label: t('moreHub.linkExample') },
          { to: '/tech-showcase', label: t('nav.techShowcase') },
          { to: '/competition-showcase', label: t('nav.competitionShowcase') },
          { to: '/team', label: t('nav.team') },
        ],
      },
    ],
    [t],
  );

  return (
    <div className="more-hub">
      <header className="more-hub-header">
        <h1 className="more-hub-title">{t('moreHub.pageTitle')}</h1>
        <p className="more-hub-sub">{t('moreHub.pageSubtitle')}</p>
      </header>

      {sections.map((section) => (
        <section key={section.title} className="more-hub-section">
          <h2 className="more-hub-section-title">{section.title}</h2>
          <ul className="more-hub-list">
            {section.items.map((item) => (
              <li key={item.to}>
                <button
                  type="button"
                  className="more-hub-row"
                  onClick={() => navigate(item.to)}
                >
                  <span className="more-hub-row-label">{item.label}</span>
                  <span className="more-hub-row-chevron" aria-hidden>›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default MoreHub;
