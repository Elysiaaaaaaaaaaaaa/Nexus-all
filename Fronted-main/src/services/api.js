/**
 * API服务模块
 * 提供与后端交互的所有API调用方法
 */

// API基础配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://3.239.121.43:8003';

// 获取认证令牌
export const getAuthToken = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }
  
  // 简单的token过期检查（如果是JWT格式）
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (exp && exp * 1000 < Date.now()) {
      // token已过期
      localStorage.removeItem('auth_token');
      return null;
    }
  } catch (e) {
    // 不是JWT格式或者是开发环境的假token，直接返回
  }
  
  return token;
};

// 通用请求函数
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: '网络请求失败' } }));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API请求失败 ${endpoint}:`, error);
    throw error;
  }
};

// 用户认证相关API
export const authAPI = {
  // 用户注册
  register: async (username, email, password) => {
    return apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  // 用户登录
  login: async (username, password) => {
    return apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

// 项目相关API
export const projectAPI = {
  // 获取用户项目列表
  getProjects: async () => {
    return apiRequest('/api/v1/projects/list', {
      method: 'POST',
    });
  },

  // 获取项目历史记录
  getProjectHistory: async (projectName) => {
    return apiRequest('/api/v1/projects/history', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName }),
    });
  },

  // 创建新项目
  createProject: async (projectName, workflowType) => {
    return apiRequest('/api/v1/projects/new', {
      method: 'POST',
      body: JSON.stringify({
        project_name: projectName,
        workflow_type: workflowType,
      }),
    });
  },
};

// 工作流相关API
export const workflowAPI = {
  // 处理用户工作流请求
  processWork: async (projectName, userInput, mode = 'production', videoDuration = null) => {
    const requestBody = {
      project_name: projectName,
      user_input: userInput,
      mode: mode,
    };

    if (videoDuration !== null && videoDuration !== undefined) {
      requestBody.video_duration = videoDuration;
    }

    return apiRequest('/api/v1/work', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  // 获取测试视频占位符
  getTestVideoPlaceholder: async () => {
    return apiRequest('/api/v1/test-video-placeholder');
  },
};

// 用户相关API
export const userAPI = {
  // 上传用户头像
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiRequest('/api/user/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // 移除Content-Type，让浏览器自动设置
    });
  },

  // 获取健康检查状态
  getHealthStatus: async () => {
    return apiRequest('/api/v1/health');
  },
};

// 设置API基础URL
export const setApiBaseUrl = (url) => {
  // 这个函数用于动态设置API基础URL（如果需要的话）
  console.log('API基础URL已设置为:', url);
};

// 错误处理工具函数
export const handleApiError = (error) => {
  console.error('API错误:', error);
  
  let message = '操作失败，请稍后重试';
  
  if (error.message) {
    if (error.message.includes('网络')) {
      message = '网络连接失败，请检查网络连接';
    } else if (error.message.includes('认证')) {
      message = '认证失败，请重新登录';
      // 清除本地存储的认证信息
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // 可以在这里触发重新登录的UI
    } else {
      message = error.message;
    }
  }
  
  return message;
};

// 所有导出都是命名导出，不需要默认导出