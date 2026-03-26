import axios from 'axios';
import { AppError } from '../types/api';
import { isProduction, safeLog } from '../utils/security';

// --- 1. 配置基础实例 ---
const instance = axios.create({
  // 优先取环境变量，否则使用代理（开发环境）或默认后端地址
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:8003'),
  timeout: 150000, // 5分钟超时（与原来的fetch一致）
  headers: { 'Content-Type': 'application/json' },
});

// --- 辅助函数：安全获取 TraceId ---
function getTraceIdFromResponse(response) {
  if (!response) return undefined;
  // 1. 优先从 Header 取
  const headerTraceId = response.headers?.['x-trace-id'];
  if (typeof headerTraceId === 'string' && headerTraceId) return headerTraceId;

  // 2. 其次从 Body 取
  const body = response.data;
  const bodyTraceId = body?.traceId;
  if (typeof bodyTraceId === 'string' && bodyTraceId) return bodyTraceId;

  return undefined;
}

// --- 辅助函数：安全获取 Token ---
function safeGetToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

// --- 2. 请求拦截器 ---
instance.interceptors.request.use(
  (config) => {
    const token = safeGetToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// --- 3. 响应拦截器 ---
instance.interceptors.response.use(
  (response) => {
    const traceId = getTraceIdFromResponse(response);
    const envelope = response.data;

    // 调试日志：查看响应格式
    if (import.meta.env.DEV) {
      console.log('%c[HTTP Response]', 'color: #22c55e; font-weight: bold;', {
        url: response.config?.url,
        method: response.config?.method?.toUpperCase(),
        status: response.status,
        hasCode: typeof envelope?.code !== 'undefined',
        hasAccessToken: typeof envelope?.access_token !== 'undefined',
        envelope,
      });
    }

    // 检查响应格式
    // 如果响应有 code 字段，说明是包装格式
    if (envelope && typeof envelope.code !== 'undefined') {
      const { code, message, data } = envelope;

      // 调试日志：包装格式响应
      if (import.meta.env.DEV) {
        console.log('%c[HTTP] 包装格式响应', 'color: #f59e0b; font-weight: bold;', {
          code,
          hasData: !!data,
          data,
        });
      }

      // 只要 code 是 0 或 200，或者 data 有值（兼容 Mock 随机生成的 code 等）
      if (code === 0 || code === 200 || data) {
        if (import.meta.env.DEV) {
          console.log('%c[HTTP] 返回 data', 'color: #22c55e; font-weight: bold;', data);
        }
        return data;
      }

      return Promise.reject(
        new AppError({
          message: message || '业务处理失败',
          code,
          isSystemError: false,
          data,
          traceId,
        }),
      );
    }

    // 如果没有 code 字段，检查是否是认证响应（直接包含 access_token）
    if (envelope && typeof envelope.access_token !== 'undefined') {
      if (import.meta.env.DEV) {
        console.log('%c[HTTP] 认证响应格式', 'color: #8b5cf6; font-weight: bold;', {
          access_token: envelope.access_token?.substring(0, 20) + '...',
          user: envelope.user,
        });
        console.log('%c[HTTP] 拦截器返回 envelope', 'color: #8b5cf6; font-weight: bold;', envelope);
      }
      console.log('拦截器返回的值:', envelope);
      return envelope;
    }

    // 兼容其他直接返回数据的格式
    if (import.meta.env.DEV) {
      console.log('%c[HTTP] 直接返回响应', 'color: #06b6d4; font-weight: bold;', envelope);
    }
    return response.data;
  },
  (error) => {
    if (!axios.isAxiosError(error)) {
      const appError = new AppError({
        message: '未知异常',
        code: 500,
        isSystemError: true,
      });
      console.error('%c[HTTP] 未知异常', 'color: #ef4444; font-weight: bold;', error);
      return Promise.reject(appError);
    }

    const axiosError = error;
    const traceId = getTraceIdFromResponse(axiosError.response);

    let message = '网络连接异常';
    let code = 500;

    if (axiosError.response) {
      code = axiosError.response.status;
      
      if (import.meta.env.DEV) {
        console.log('%c[HTTP] 响应错误', 'color: #ef4444; font-weight: bold;', {
          url: axiosError.config?.url,
          method: axiosError.config?.method?.toUpperCase(),
          status: code,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          traceId,
        });
      }

      if (code === 401) {
        // 401 时清除认证信息
        // 注意：不能在拦截器中使用 React Hook，直接清除 localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('app-user-id');
        localStorage.removeItem('app-user-info');
        message = '登录已过期，请重新登录';
      } else if (code === 403) {
        message = '您没有权限访问该资源';
      } else if (code === 404) {
        message = '请求的资源不存在';
      } else {
        const respData = axiosError.response.data;
        // 生产环境不暴露详细错误信息
        if (isProduction()) {
          message = `系统异常 (${code})`;
        } else {
          const serverMsg = typeof respData?.message === 'string' ? respData.message : undefined;
          message = serverMsg || `系统异常 (${code})`;
        }
      }
    } else if (
      axiosError.code === 'ECONNABORTED' ||
      (axiosError.message && axiosError.message.includes('timeout'))
    ) {
      message = '请求超时，请检查网络';
      code = 504;
      if (import.meta.env.DEV) {
        console.log('%c[HTTP] 请求超时', 'color: #f97316; font-weight: bold;', {
          url: axiosError.config?.url,
          timeout: axiosError.config?.timeout,
        });
      }
    } else if (axiosError.message && axiosError.message.includes('Network Error')) {
      message = '网络错误，请检查后端服务是否运行';
      code = 0;
      if (import.meta.env.DEV) {
        console.log('%c[HTTP] 网络错误', 'color: #ef4444; font-weight: bold;', {
          url: axiosError.config?.url,
          message: axiosError.message,
        });
      }
    }

    const appError = new AppError({
      message,
      code,
      isSystemError: true,
      traceId,
    });
    
    return Promise.reject(appError);
  },
);

// --- 4. 导出强类型封装方法 ---
export const http = {
  /**
   * GET 请求
   * @template T
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  get(url, config) {
    return instance.get(url, config);
  },

  /**
   * POST 请求
   * @template T
   * @param {string} url
   * @param {unknown} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  post(url, data, config) {
    if (import.meta.env.DEV) {
      console.log('%c[HTTP.post] 调用', 'color: #eab308; font-weight: bold;', { url });
    }
    return instance.post(url, data, config).then((response) => {
      console.log('[HTTP.post] then 回调接收到的值:', response);
      if (import.meta.env.DEV) {
        console.log('%c[HTTP.post] then 回调', 'color: #eab308; font-weight: bold;', {
          response,
          hasAccessToken: response?.access_token !== undefined,
        });
      }
      return response;
    });
  },

  /**
   * PUT 请求
   * @template T
   * @param {string} url
   * @param {unknown} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  put(url, data, config) {
    return instance.put(url, data, config);
  },

  /**
   * DELETE 请求
   * @template T
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  delete(url, config) {
    return instance.delete(url, config);
  },

  /**
   * 上传文件（专门用于文件上传，自动设置 Content-Type）
   * @template T
   * @param {string} url 接口地址
   * @param {File | FormData} file 文件对象或 FormData
   * @param {string} [fieldName='file'] 文件字段名
   * @returns {Promise<T>}
   */
  upload(url, file, fieldName = 'file') {
    let formData;
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append(fieldName, file);
    }

    // FormData 必须由浏览器/axios 自动带 boundary，勿手写 multipart Content-Type
    return instance
      .post(url, formData, {});
  },
};

export default instance;
