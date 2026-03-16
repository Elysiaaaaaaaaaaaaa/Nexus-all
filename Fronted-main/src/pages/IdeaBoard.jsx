import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, RocketLaunch, FlowArrow, Folder, DownloadSimple, ShieldCheck, Play, Sparkle } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import './IdeaBoard.css';

const IdeaBoard = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [filter, setFilter] = useState('all');

  const ideas = useMemo(() => ([
    {
      key: 'materials-workbench',
      tag: 'materials',
      title: t('ideas.materialsWorkbenchTitle'),
      desc: t('ideas.materialsWorkbenchDesc'),
      icon: <Folder weight="fill" />,
      action: () => navigate('/assets')
    },
    {
      key: 'workflow-composer',
      tag: 'workflow',
      title: t('ideas.workflowComposerTitle'),
      desc: t('ideas.workflowComposerDesc'),
      icon: <FlowArrow weight="fill" />,
      action: () => navigate('/workflows')
    },
    {
      key: 'export-packs',
      tag: 'export',
      title: t('ideas.exportPackTitle'),
      desc: t('ideas.exportPackDesc'),
      icon: <DownloadSimple weight="fill" />,
      action: () => navigate('/export')
    },
    {
      key: 'security',
      tag: 'security',
      title: t('ideas.securityTitle'),
      desc: t('ideas.securityDesc'),
      icon: <ShieldCheck weight="fill" />,
      action: () => navigate('/security')
    },
    {
      key: 'demo-gallery',
      tag: 'growth',
      title: t('ideas.galleryTitle'),
      desc: t('ideas.galleryDesc'),
      icon: <Sparkle weight="fill" />,
      action: () => alert(t('ideas.comingSoon'))
    },
    {
      key: 'one-click-demo',
      tag: 'growth',
      title: t('ideas.oneClickDemoTitle'),
      desc: t('ideas.oneClickDemoDesc'),
      icon: <Play weight="fill" />,
      action: () => alert(t('ideas.comingSoon'))
    }
  ]), [navigate, t]);

  const filtered = useMemo(() => {
    if (filter === 'all') return ideas;
    return ideas.filter(i => i.tag === filter);
  }, [filter, ideas]);

  return (
    <div className="idea-board">
      <header className="idea-board-header">
        <div className="idea-board-title">
          <Lightbulb weight="fill" size={18} />
          <span>{t('ideas.title')}</span>
        </div>
        <div className="idea-board-subtitle">{t('ideas.subtitle')}</div>
      </header>

      <div className="idea-filters">
        {['all', 'materials', 'workflow', 'export', 'security', 'growth'].map((k) => (
          <button
            key={k}
            className={`idea-filter ${filter === k ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter(k)}
          >
            {t(`ideas.filter.${k}`)}
          </button>
        ))}
      </div>

      <div className="idea-grid">
        {filtered.map((i) => (
          <button key={i.key} className="idea-card" type="button" onClick={i.action}>
            <div className="idea-card-icon">{i.icon}</div>
            <div className="idea-card-main">
              <div className="idea-card-title">{i.title}</div>
              <div className="idea-card-desc">{i.desc}</div>
            </div>
            <div className="idea-card-cta">
              <RocketLaunch size={16} />
              <span>{t('ideas.open')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IdeaBoard;

