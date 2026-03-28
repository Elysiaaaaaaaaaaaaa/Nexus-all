import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowArrow, Rocket, SlidersHorizontal, PencilSimpleLine } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext.jsx';
import { createProject } from '../services/api';
import { isNativeMobileLayout } from '../utils/runtimePlatform';
import './WorkflowHub.css';

const WorkflowHub = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const { showToast } = useToast();

  const resolveWorkflowType = (workflow) => (
    workflow === 'storyboard_precise' ? 'image2video' : 'text2video'
  );

  const startWorkflow = async (workflow) => {
    const workflowType = resolveWorkflowType(workflow);
    const projectName = `${workflowType === 'image2video' ? '图生视频' : '文生视频'}_${Date.now()}`;

    try {
      const created = await createProject({
        project_name: projectName,
        workflow_type: workflowType,
      });
      localStorage.setItem('app-current-project', created?.project_name || projectName);
      localStorage.setItem('app-current-workflow-type', workflowType);
      if (created?.session_id) {
        localStorage.setItem('app-current-session-id', created.session_id);
      }
      navigate('/interaction', { state: { workflow, projectName: created?.project_name || projectName } });
    } catch {
      localStorage.setItem('app-current-project', projectName);
      localStorage.setItem('app-current-workflow-type', workflowType);
      navigate('/interaction', { state: { workflow, projectName } });
    }
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

