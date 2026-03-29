import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowArrow, Rocket, SlidersHorizontal, PencilSimpleLine } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext.jsx';
import { isNativeMobileLayout } from '../utils/runtimePlatform';
import { startNewWorkflow } from '../utils/startNewWorkflow';
import './WorkflowHub.css';

const WorkflowHub = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const { showToast } = useToast();

  const startWorkflow = (workflow) => {
    void startNewWorkflow(navigate, workflow);
  };

  const cards = [
    {
      title: t('workflows.fastTitle'),
      desc: t('workflows.fastDesc'),
      icon: <Rocket weight="fill" />,
      onClick: () => startWorkflow('text_to_video_fast'),
      accent: 'fast'
    },
    {
      title: t('workflows.storyTitle'),
      desc: t('workflows.storyDesc'),
      icon: <PencilSimpleLine weight="fill" />,
      onClick: () => startWorkflow('storyboard_precise'),
      accent: 'story'
    },
    {
      title: t('workflows.customTitle'),
      desc: t('workflows.customDesc'),
      icon: <SlidersHorizontal weight="fill" />,
      onClick: () => showToast({ message: t('workflows.customComingSoon'), variant: 'info', duration: 3200 }),
      accent: 'custom'
    }
  ];

  return (
    <div className="workflow-hub">
      <header className="workflow-hub-header">
        <div className="workflow-hub-title">
          <FlowArrow weight="fill" size={18} />
          <span>{t('workflows.title')}</span>
        </div>
        <div className="workflow-hub-subtitle">{t('workflows.subtitle')}</div>
        {isNativeMobileLayout() && (
          <p className="workflow-hub-mobile-orchestration-hint" role="note">
            {t('workflows.mobileOrchestrationHint')}
          </p>
        )}
      </header>

      <div className="workflow-grid">
        {cards.map((c) => (
          <button key={c.title} className={`workflow-card ${c.accent}`} onClick={c.onClick} type="button">
            <div className="workflow-card-icon">{c.icon}</div>
            <div className="workflow-card-title">{c.title}</div>
            <div className="workflow-card-desc">{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkflowHub;

