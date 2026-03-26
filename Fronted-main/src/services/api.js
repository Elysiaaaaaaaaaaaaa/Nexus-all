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
 * @param {string} params.user_id - 用户ID（可选，默认从localStorage获取）
 * @param {string} params.mode - 运行模式，默认'production'（生产模式），可选'test'（测试模式）
 * @param {number} params.video_duration - 视频时长（秒，可选）
 * @param {number[]} params.modify_nums - 修改编号列表（可选）
 * @returns {Promise<Object>} 响应数据
 */
export const work = async (params) => {
  const {
    project_name,
    user_input,
    user_id = getUserId(),
    mode = 'production',
    video_duration,
    modify_nums = [],
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

  return http.post('/api/v1/work', {
    project_name: sanitizedProjectName,
    user_input: sanitizedInput,
    user_id,
    mode,
    ...(video_duration !== undefined && { video_duration }),
    ...(modify_nums.length > 0 && { modify_nums: modify_nums.filter(n => typeof n === 'number' && n >= 0) }),
  });
};

/**
 * 获取用户项目列表
 * @param {string} user_id - 用户ID（可选，默认从localStorage获取）
 * @returns {Promise<Object>} 项目列表
 */
export const getProjectsList = async (user_id = null) => {
  const userId = user_id || getUserId();
  return http.post('/api/v1/projects/list', {
    user_id: userId,
  });
};

/**
 * 获取指定项目的对话历史
 * @param {Object} params - 请求参数
 * @param {string} params.project_name - 项目名称
 * @param {string} params.user_id - 用户ID（可选，默认从localStorage获取）
 * @returns {Promise<Object>} 对话历史和会话数据
 */
export const getProjectHistory = async (params) => {
  const { project_name, user_id = null } = params;
  const userId = user_id || getUserId();

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
    user_id: userId,
    project_name: sanitizedProjectName,
  });
};

/**
 * 新建项目
 * @param {Object} params - 请求参数
 * @param {string} params.project_name - 项目名称
 * @param {string} params.workflow_type - 工作流类型 ('text2video' 或 'image2video')
 * @param {string} params.user_id - 用户ID（可选，默认从localStorage获取）
 * @returns {Promise<Object>} 新建项目信息
 */
export const createProject = async (params) => {
  const { project_name, workflow_type = 'text2video', user_id = null } = params;
  const userId = user_id || getUserId();

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
    user_id: userId,
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

  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[API Register] 响应数据:', response);
    console.log('[API Register] 是否有 access_token:', !!response?.access_token);
  }

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

  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[API Login] 响应数据:', response);
    console.log('[API Login] 是否有 access_token:', !!response?.access_token);
  }

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
 * 健康检查
 * @returns {Promise<Object>} 健康状态
 */
export const healthCheck = async () => {
  return http.get('/api/v1/health');
};

/** 与 http.js 一致的后端根地址，用于拼接上传返回的相对路径 */
const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:8003');

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
 * 上传图片（multipart/form-data）
 * POST /api/v1/upload_image
 * @param {Object} params
 * @param {File} params.file - 图片文件
 * @param {string} params.figure_name - 图像名称（测试阶段字段）
 * @param {string} params.project_name - 项目名称
 * @param {string} [params.user_id] - 用户 ID，默认 localStorage
 * @returns {Promise<{ success?: boolean, message?: string, data?: { filePath?: string, size?: number } }>}
 */
export const uploadImage = async (params) => {
  const { file, figure_name, project_name, user_id = null } = params;

  if (!file || !(file instanceof File)) {
    throw new AppError({
      message: '请选择有效的图片文件',
      code: 400,
      isSystemError: false,
    });
  }

  if (!figure_name || !project_name) {
    throw new AppError({
      message: 'figure_name 和 project_name 为必填',
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

  const userId = user_id || getUserId();
  const safeFigure = sanitizeInput(String(figure_name), 200);
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
  formData.append('user_id', userId);
  formData.append('figure_name', safeFigure);
  formData.append('project_name', safeProject);
  formData.append('file', file);

  return http.upload('/api/v1/upload_image', formData, 'file');
};
