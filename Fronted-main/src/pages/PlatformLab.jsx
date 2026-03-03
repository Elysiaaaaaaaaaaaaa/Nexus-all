import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flask, ArrowRight, Sparkle, ShieldCheck, Broadcast, Database } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import './PlatformLab.css';

const PlatformLab = () => {
  const navigate = useNavigate();
  const { t } = useApp();

  const items = [
    { title: t('lab.assets'), desc: t('lab.assetsDesc'), icon: <Database weight="fill" />, path: '/assets' },
    { title: t('lab.workflows'), desc: t('lab.workflowsDesc'), icon: <Broadcast weight="fill" />, path: '/workflows' },
    { title: t('lab.export'), desc: t('lab.exportDesc'), icon: <Sparkle weight="fill" />, path: '/export' },
    { title: t('lab.security'), desc: t('lab.securityDesc'), icon: <ShieldCheck weight="fill" />, path: '/security' }
  ];

  return (
    <div className="platform-lab">
      <header className="platform-lab-header">
        <div className="platform-lab-title">
          <Flask weight="fill" size={18} />
          <span>{t('lab.title')}</span>
        </div>
        <div className="platform-lab-subtitle">{t('lab.subtitle')}</div>
      </header>

      <div className="platform-lab-grid">
        {items.map((it) => (
          <button key={it.path} className="platform-lab-card" onClick={() => navigate(it.path)} type="button">
            <div className="platform-lab-card-icon">{it.icon}</div>
            <div className="platform-lab-card-main">
              <div className="platform-lab-card-title">{it.title}</div>
              <div className="platform-lab-card-desc">{it.desc}</div>
            </div>
            <ArrowRight size={16} className="platform-lab-card-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformLab;

