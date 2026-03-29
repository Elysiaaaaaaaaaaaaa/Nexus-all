import { createProject } from '../services/api';

/**
 * UI 工作流 key → 后端 workflow_type
 * @param {'text_to_video_fast'|'storyboard_precise'} workflow
 * @returns {'text2video'|'image2video'}
 */
export function resolveWorkflowType(workflow) {
  return workflow === 'storyboard_precise' ? 'image2video' : 'text2video';
}

/**
 * 调用 POST /api/v1/projects/new，写入 localStorage，进入交互页
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {'text_to_video_fast'|'storyboard_precise'} workflow
 */
export async function startNewWorkflow(navigate, workflow) {
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
}
