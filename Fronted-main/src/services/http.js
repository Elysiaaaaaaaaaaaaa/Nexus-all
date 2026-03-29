import axios from 'axios';
import { AppError } from '../types/api';
import { isProduction } from '../utils/security';
import { resolveApiBaseUrl } from '../utils/apiBaseUrl';

// --- 1. 配置基础实例 ---
const instance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 150000, // 5分钟超时（与原来的fetch一致）
  headers: { 'Content-Type': 'application/json' },
});

/** 解析 FastAPI HTTPException / 校验错误等响应中的可读文案 */
function getFastApiErrorMessage(respData) {
  if (!respData || typeof respData !== 'object') return undefined;
  if (typeof respData.message === 'string' && respData.message) return respData.message;
  const d = respData.detail;
  if (typeof d === 'string' && d) return d;
  if (Array.isArray(d)) {
    return d
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join('; ');
  }
  if (d && typeof d === 'object' && typeof d.msg === 'string') return d.msg;
  return undefined;
}

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

    // 后端 get_error_response：HTTP 200 + { success: false, error: { code, message } }
    if (envelope && envelope.success === false) {
      const errObj = envelope.error;
      const msg =
        (errObj && typeof errObj.message === 'string' && errObj.message) ||
        getFastApiErrorMessage(envelope) ||
        '请求失败';
      const code =
        errObj && typeof errObj.code === 'number' ? errObj.code : 400;
      return Promise.reject(
        new AppError({
          message: msg,
          code,
          isSystemError: false,
          traceId,
        }),
      );
    }

    // 检查响应格式
    // 如果响应有 code 字段，说明是包装格式
    if (envelope && typeof envelope.code !== 'undefined') {
      const { code, message, data } = envelope;

      // 只要 code 是 0 或 200，或者 data 有值（兼容 Mock 随机生成的 code 等）
      if (code === 0 || code === 200 || data) {
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
      return envelope;
    }

    // 兼容其他直接返回数据的格式
    return response.data;
  },
  (error) => {
    if (!axios.isAxiosError(error)) {
      const appError = new AppError({
        message: '未知异常',
        code: 500,
        isSystemError: true,
      });
      return Promise.reject(appError);
    }

    const axiosError = error;
    const traceId = getTraceIdFromResponse(axiosError.response);

    let message = '网络连接异常';
    let code = 500;

    if (axiosError.response) {
      code = axiosError.response.status;
      const reqUrl = axiosError.config?.url || '';

      if (code === 401) {
        const isAuthLoginOrRegister =
          reqUrl.includes('/api/v1/auth/login') ||
          reqUrl.includes('/api/v1/auth/register');
        if (!isAuthLoginOrRegister) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('app-user-id');
          localStorage.removeItem('app-user-info');
        }
        message =
          getFastApiErrorMessage(axiosError.response.data) ||
          (isAuthLoginOrRegister ? '用户名或密码错误' : '登录已过期，请重新登录');
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
          message =
            getFastApiErrorMessage(respData) ||
            (typeof respData?.message === 'string' ? respData.message : undefined) ||
            `系统异常 (${code})`;
        }
      }
    } else if (
      axiosError.code === 'ECONNABORTED' ||
      (axiosError.message && axiosError.message.includes('timeout'))
    ) {
      message = '请求超时，请检查网络';
      code = 504;
    } else if (axiosError.message && axiosError.message.includes('Network Error')) {
      message = '网络错误，请检查后端服务是否运行';
      code = 0;
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
    return instance.post(url, data, config).then((response) => response);
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

    // 与 API_DOCUMENTATION.md §3.7 一致：multipart/form-data；勿沿用实例默认的 application/json
    return instance.post(url, formData, {
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData && headers) {
            if (typeof headers.delete === 'function') {
              headers.delete('Content-Type');
            } else {
              delete headers['Content-Type'];
            }
          }
          return data;
        },
      ],
    });
  },
};

export default instance;
