/**
 * API服务层
 * 统一管理所有后端API调用
 * 使用 axios 封装替代原来的 fetch
 */
import { http } from './http';
import { AppError } from '../types/api';
import { validateProjectName, sanitizeInput } from '../utils/security';

/**
 * 获取用户ID（从localStorage）
 */
export const getUserId = () => {
  let userId = localStorage.getItem('app-user-id');
  if (!userId) {
    // 生成新的用户ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('app-user-id', userId);
  }
  return userId;
};

/**
 * 设置用户ID
 */
export const setUserId = (userId) => {
  localStorage.setItem('app-user-id', userId);
};

/**
 * 获取保存的认证token
 * @returns {string|null} 认证token
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * 工作处理接口
 * @param {Object} params - 请求参数
 * @param {string} params.project_name - 项目名称
 * @param {string} params.user_input - 用户输入
 * @param {string} params.mode - 运行模式，默认'production'（生产模式），可选'test'（测试模式）
 * @param {number} params.video_duration - 视频时长（秒，可选）
 * @param {number[]} params.modify_nums - 修改编号列表（可选，对应后端 modify_num）
 * @param {string} [params.workflow_type] - text2video | image2video，默认 text2video
 * @returns {Promise<Object>} 响应数据
 */
export const work = async (params) => {
  const {
    project_name,
    user_input,
    mode = 'production',
    video_duration,
    modify_nums = [],
    workflow_type = 'text2video',
  } = params;

  // 输入验证
  if (!project_name || !user_input) {
    throw new AppError({
      message: 'project_name 和 user_input 是必填参数',
      code: 400,
      isSystemError: false,
    });
  }

  // 验证项目名称
  const projectNameValidation = validateProjectName(project_name);
  if (!projectNameValidation.valid) {
    throw new AppError({
      message: projectNameValidation.message || '项目名称无效',
      code: 400,
      isSystemError: false,
    });
  }

  // 清理用户输入，防止 XSS
  const sanitizedInput = sanitizeInput(user_input, 10000);
  const sanitizedProjectName = sanitizeInput(project_name, 100);

  // 验证模式
  if (!['production', 'test'].includes(mode)) {
    throw new AppError({
      message: 'mode 必须是 production 或 test',
      code: 400,
      isSystemError: false,
    });
  }

  // 验证视频时长
  if (video_duration !== undefined && (typeof video_duration !== 'number' || video_duration < 0 || video_duration > 3600)) {
    throw new AppError({
      message: 'video_duration 必须是 0-3600 之间的数字',
      code: 400,
      isSystemError: false,
    });
  }

  // 验证修改编号列表
  if (modify_nums && !Array.isArray(modify_nums)) {
    throw new AppError({
      message: 'modify_nums 必须是数组',
      code: 400,
      isSystemError: false,
    });
  }

  if (!['text2video', 'image2video'].includes(workflow_type)) {
    throw new AppError({
      message: 'workflow_type 必须是 text2video 或 image2video',
      code: 400,
      isSystemError: false,
    });
  }

  const filteredModify = modify_nums.filter((n) => typeof n === 'number' && n > 0);

  return http.post('/api/v1/work', {
    project_name: sanitizedProjectName,
    user_input: sanitizedInput,
    mode,
    workflow_type,
    ...(video_duration !== undefined && { video_duration }),
    ...(filteredModify.length > 0 && { modify_num: filteredModify }),
  });
};

/**
 * 获取用户项目列表（user_id 由 JWT 解析，与接口文档一致）
 * @returns {Promise<Object>} 项目列表
 */
export const getProjectsList = async () => {
  return http.post('/api/v1/projects/list', {});
};

/**
 * 获取指定项目的对话历史（user_id 由 JWT 解析）
 * @param {Object} params - 请求参数
 * @param {string} params.project_name - 项目名称
 * @returns {Promise<Object>} 对话历史和会话数据
 */
export const getProjectHistory = async (params) => {
  const { project_name } = params;

  if (!project_name) {
    throw new AppError({
      message: 'project_name 是必填参数',
      code: 400,
      isSystemError: false,
    });
  }

  // 验证并清理项目名称
  const projectNameValidation = validateProjectName(project_name);
  if (!projectNameValidation.valid) {
    throw new AppError({
      message: projectNameValidation.message || '项目名称无效',
      code: 400,
      isSystemError: false,
    });
  }

  const sanitizedProjectName = sanitizeInput(project_name, 100);

  return http.post('/api/v1/projects/history', {
    project_name: sanitizedProjectName,
  });
};

/**
 * 新建项目（user_id 由 JWT 解析）
 * @param {Object} params - 请求参数
 * @param {string} params.project_name - 项目名称
 * @param {string} params.workflow_type - 工作流类型 ('text2video' 或 'image2video')
 * @returns {Promise<Object>} 新建项目信息
 */
export const createProject = async (params) => {
  const { project_name, workflow_type = 'text2video' } = params;

  if (!project_name) {
    throw new AppError({
      message: 'project_name 是必填参数',
      code: 400,
      isSystemError: false,
    });
  }

  // 验证项目名称
  const projectNameValidation = validateProjectName(project_name);
  if (!projectNameValidation.valid) {
    throw new AppError({
      message: projectNameValidation.message || '项目名称无效',
      code: 400,
      isSystemError: false,
    });
  }

  if (!['text2video', 'image2video'].includes(workflow_type)) {
    throw new AppError({
      message: 'workflow_type 必须是 text2video 或 image2video',
      code: 400,
      isSystemError: false,
    });
  }

  const sanitizedProjectName = sanitizeInput(project_name, 100);

  return http.post('/api/v1/projects/new', {
    project_name: sanitizedProjectName,
    workflow_type,
  });
};

/**
 * 用户注册
 * @param {Object} params - 注册参数
 * @param {string} params.username - 用户名
 * @param {string} params.email - 邮箱
 * @param {string} params.password - 密码
 * @returns {Promise<Object>} 注册结果
 */
export const register = async (params) => {
  const { username, email, password } = params;

  if (!username || !email || !password) {
    throw new AppError({
      message: '用户名、邮箱和密码都是必填项',
      code: 400,
      isSystemError: false,
    });
  }

  const response = await http.post('/api/v1/auth/register', {
    username,
    email,
    password,
  });

  // 保存token到localStorage
  if (response.access_token) {
    localStorage.setItem('auth_token', response.access_token);
  }

  return response;
};

/**
 * 用户登录
 * @param {Object} params - 登录参数
 * @param {string} params.username - 用户名或邮箱
 * @param {string} params.password - 密码
 * @returns {Promise<Object>} 登录结果
 */
export const login = async (params) => {
  const { username, password } = params;

  if (!username || !password) {
    throw new AppError({
      message: '用户名和密码都是必填项',
      code: 400,
      isSystemError: false,
    });
  }

  const response = await http.post('/api/v1/auth/login', {
    username,
    password,
  });

  // 保存token到localStorage
  if (response.access_token) {
    localStorage.setItem('auth_token', response.access_token);
  }

  return response;
};

/**
 * 用户登出
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('app-user-id');
  localStorage.removeItem('app-user-info');
};

/**
 * 健康检查 GET /api/v1/health
 * @returns {Promise<Object>} 健康状态
 */
export const healthCheck = async () => {
  return http.get('/api/v1/health');
};

/**
 * 根路径 GET /（与接口文档一致）
 * @returns {Promise<Object>}
 */
export const rootInfo = async () => {
  return http.get('/');
};

/** 与 http.js 一致的后端根地址，用于拼接上传返回的相对路径 */
const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'http://101.200.1.56');

/**
 * 将上传接口返回的相对路径转为可访问 URL
 * @param {string} filePath
 * @returns {string}
 */
export const buildUploadFilePublicUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmed = filePath.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getApiBaseUrl().replace(/\/$/, '');
  const path = trimmed.replace(/^\/+/, '');
  return `${base}/${path}`;
};

const UPLOAD_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

/**
 * POST /api/v1/upload_image — 与 Backend-test/API_DOCUMENTATION.md §3.7 一致
 * - 鉴权：axios 拦截器自动带 Authorization: Bearer（localStorage auth_token）
 * - multipart 字段名：project_name（必填）、file（必填）、figure_name（可选）
 * - 类型/大小校验与文档「文件限制」一致；Token 由后端解析 user_id
 *
 * @param {Object} params
 * @param {File} params.file - 图片文件，表单字段名必须为 file
 * @param {string} params.project_name - 项目名称（必填）
 * @param {string} [params.figure_name] - 可选，与文档一致；不传则不附加该表单项
 * @returns {Promise<{ success?: boolean, message?: string, data?: { filePath?: string, size?: number } }>}
 */
export const uploadImage = async (params) => {
  const { file, figure_name, project_name } = params;

  if (!file || !(file instanceof File)) {
    throw new AppError({
      message: '请选择有效的图片文件',
      code: 400,
      isSystemError: false,
    });
  }

  if (!project_name) {
    throw new AppError({
      message: 'project_name 为必填',
      code: 400,
      isSystemError: false,
    });
  }

  const mime = (file.type || '').toLowerCase();
  if (!UPLOAD_IMAGE_MIME.has(mime)) {
    throw new AppError({
      message: '仅支持 jpeg、jpg、png、gif、webp 图片',
      code: 400,
      isSystemError: false,
    });
  }

  if (file.size > UPLOAD_IMAGE_MAX_BYTES) {
    throw new AppError({
      message: '图片大小不能超过 10MB',
      code: 400,
      isSystemError: false,
    });
  }

  const projectNameValidation = validateProjectName(project_name);
  if (!projectNameValidation.valid) {
    throw new AppError({
      message: projectNameValidation.message || '项目名称无效',
      code: 400,
      isSystemError: false,
    });
  }
  const safeProject = sanitizeInput(project_name, 100);

  const formData = new FormData();
  formData.append('project_name', safeProject);
  if (figure_name != null && String(figure_name).trim() !== '') {
    formData.append('figure_name', sanitizeInput(String(figure_name), 200));
  }
  formData.append('file', file);

  return http.upload('/api/v1/upload_image', formData, 'file');
};

/**
 * 用户头像 POST /api/user/avatar（multipart 字段 avatar，可选 user_id）
 * @param {File} file
 * @returns {Promise<{ success?: boolean, data?: { avatarUrl?: string, url?: string } }>}
 */
export const uploadUserAvatar = async (file) => {
  if (!file || !(file instanceof File)) {
    throw new AppError({
      message: '请选择有效的图片文件',
      code: 400,
      isSystemError: false,
    });
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const uid = getUserId();
  if (uid) {
    formData.append('user_id', uid);
  }
  return http.upload('/api/user/avatar', formData, 'avatar');
};

/**
 * 右侧「任务与素材 / 实时执行」面板数据
 * POST /api/v1/interaction/panel
 * @param {Object} params
 * @param {string} params.project_name - 项目名称
 * @param {string} [params.session_id] - 会话 ID（可选）
 * @param {string} [params.workflow] - 前端工作流标识（可选）
 * @param {string} [params.user_id] - 用户 ID（可选，默认 localStorage）
 * @returns {Promise<{
 *   success?: boolean,
 *   data?: {
 *     execution?: { logs?: Array<{ time?: string, level?: string, message?: string }>, simulation_quote?: string, metrics?: { vram?: string, frameTime?: string, fps?: string, latency?: string } },
 *     task_assets?: { now_task?: { name?: string, stage?: string, progress?: number|string }, materials?: unknown[] }
 *   }
 * }>}
 */
export const getInteractionPanelData = async (params) => {
  const {
    project_name,
    session_id = '',
    workflow = '',
    user_id = null,
  } = params || {};

  if (!project_name) {
    throw new AppError({
      message: 'project_name 是必填参数',
      code: 400,
      isSystemError: false,
    });
  }

  const userId = user_id || getUserId();
  const safeProject = sanitizeInput(project_name, 100);

  return http.post('/api/v1/interaction/panel', {
    user_id: userId,
    project_name: safeProject,
    session_id,
    workflow,
  });
};
