import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilmStrip, Image } from '@phosphor-icons/react';
import { useApp } from '../../contexts/AppContext';
import { createProject } from '../../services/api';
import './DashboardMobile.css';

/**
 * 原生壳内仪表盘：大卡片 + 触控友好，与 Web Dashboard 逻辑对齐（创建项目 → 交互页）
 */
const DashboardMobile = () => {
  const navigate = useNavigate();
  const { t } = useApp();

  const resolveWorkflowType = (workflow) =>
    workflow === 'storyboard_precise' ? 'image2video' : 'text2video';

  const goInteractionEntry = () => {
    if (localStorage.getItem('app-current-project')) {
      navigate('/interaction');
      return;
    }
    navigate('/workflows');
  };

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
      navigate('/interaction', {
        state: { workflow, projectName: created?.project_name || projectName },
      });
    } catch {
      localStorage.setItem('app-current-project', projectName);
      localStorage.setItem('app-current-workflow-type', workflowType);
      navigate('/interaction', { state: { workflow, projectName } });
    }
  };

  return (
    <div className="dashboard-mobile">
      <header className="dashboard-mobile-header">
        <h1 className="dashboard-mobile-title">
          {t('dashboard.headlineMain')}
          <span className="dashboard-mobile-highlight">{t('dashboard.headlineHighlight')}</span>
          {t('dashboard.headlineTail')}
        </h1>
        <p className="dashboard-mobile-sub">{t('dashboard.subtitle')}</p>
      </header>

      <div className="dashboard-mobile-cards">
        <button
          type="button"
          className="dashboard-mobile-card dashboard-mobile-card-fast"
          onClick={() => startWorkflow('text_to_video_fast')}
        >
          <span className="dashboard-mobile-card-icon" aria-hidden>
            <FilmStrip size={28} weight="fill" />
          </span>
          <span className="dashboard-mobile-card-title">{t('dashboard.workflowFastTitle')}</span>
          <span className="dashboard-mobile-card-desc">{t('dashboard.workflowFastDesc')}</span>
        </button>
        <button
          type="button"
          className="dashboard-mobile-card dashboard-mobile-card-story"
          onClick={() => startWorkflow('storyboard_precise')}
        >
          <span className="dashboard-mobile-card-icon" aria-hidden>
            <Image size={28} weight="fill" />
          </span>
          <span className="dashboard-mobile-card-title">{t('dashboard.workflowStoryboardTitle')}</span>
          <span className="dashboard-mobile-card-desc">{t('dashboard.workflowStoryboardDesc')}</span>
        </button>
      </div>

      <div className="dashboard-mobile-studio-wrap">
        <button
          type="button"
          className="dashboard-mobile-studio"
          onClick={goInteractionEntry}
        >
          <span className="dashboard-mobile-studio-title">{t('dashboard.mobileEnterInteraction')}</span>
          <span className="dashboard-mobile-studio-hint">{t('dashboard.mobileEnterInteractionHint')}</span>
        </button>
        <p className="dashboard-mobile-studio-footnote">{t('dashboard.mobileEnterInteractionShortHint')}</p>
      </div>
    </div>
  );
};

export default DashboardMobile;
