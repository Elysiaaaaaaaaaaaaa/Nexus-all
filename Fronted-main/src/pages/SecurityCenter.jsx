import React from 'react';
import { ShieldCheck, Key, Lock, ClipboardText, WarningCircle } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import './SecurityCenter.css';

const SecurityCenter = () => {
  const { t } = useApp();

  const items = [
    {
      title: t('security.keys'),
      desc: t('security.keysDesc'),
      icon: <Key weight="fill" />,
      action: () => alert(t('security.comingSoon'))
    },
    {
      title: t('security.audit'),
      desc: t('security.auditDesc'),
      icon: <ClipboardText weight="fill" />,
      action: () => alert(t('security.comingSoon'))
    },
    {
      title: t('security.permissions'),
      desc: t('security.permissionsDesc'),
      icon: <Lock weight="fill" />,
      action: () => alert(t('security.comingSoon'))
    }
  ];

  return (
    <div className="security-center">
      <header className="security-header">
        <div className="security-title">
          <ShieldCheck weight="fill" size={18} />
          <span>{t('security.title')}</span>
        </div>
        <div className="security-subtitle">{t('security.subtitle')}</div>
      </header>

      <div className="security-warning">
        <WarningCircle weight="bold" size={18} />
        <div>
          <div className="security-warning-title">{t('security.tipTitle')}</div>
          <div className="security-warning-desc">{t('security.tipDesc')}</div>
        </div>
      </div>

      <div className="security-grid">
        {items.map((it) => (
          <button key={it.title} className="security-card" onClick={it.action} type="button">
            <div className="security-card-icon">{it.icon}</div>
            <div className="security-card-main">
              <div className="security-card-title">{it.title}</div>
              <div className="security-card-desc">{it.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SecurityCenter;

