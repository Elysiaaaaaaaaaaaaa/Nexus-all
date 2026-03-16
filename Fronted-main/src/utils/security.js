/**
 * 安全工具函数
 * 提供输入验证、XSS防护、路径验证等功能
 */

/**
 * 验证并清理用户输入，防止 XSS 攻击
 * @param {string} input - 用户输入
 * @param {number} [maxLength=1000] - 最大长度
 * @returns {string} 清理后的输入
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }

  // 限制长度
  let sanitized = input.slice(0, maxLength);

  // 移除潜在的脚本标签和事件处理器
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');

  // 移除 HTML 标签（保留基本格式）
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  return sanitized.trim();
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {{ valid: boolean; message?: string }}
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: '用户名不能为空' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, message: '用户名至少需要3个字符' };
  }

  if (trimmed.length > 20) {
    return { valid: false, message: '用户名不能超过20个字符' };
  }

  // 只允许字母、数字、下划线、连字符
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和连字符' };
  }

  return { valid: true };
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {{ valid: boolean; message?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: '邮箱不能为空' };
  }

  const trimmed = email.trim().toLowerCase();

  // 基本邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: '请输入有效的邮箱地址' };
  }

  // 长度限制
  if (trimmed.length > 254) {
    return { valid: false, message: '邮箱地址过长' };
  }

  // 防止邮箱注入攻击
  if (trimmed.includes('<') || trimmed.includes('>') || trimmed.includes('\n')) {
    return { valid: false, message: '邮箱地址包含非法字符' };
  }

  return { valid: true };
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {{ valid: boolean; message?: string; strength?: 'weak' | 'medium' | 'strong' }}
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' };
  }

  if (password.length < 6) {
    return { valid: false, message: '密码至少需要6个字符' };
  }

  if (password.length > 128) {
    return { valid: false, message: '密码不能超过128个字符' };
  }

  // 检查密码强度
  let strength = 'weak';
  if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    strength = 'medium';
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength = 'strong';
    }
  }

  return { valid: true, strength };
}

/**
 * 验证并清理 URL 路径，防止开放重定向攻击
 * @param {string} path - 路径
 * @returns {string | null} 验证后的路径，如果无效返回 null
 */
export function validateRedirectPath(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // 移除查询参数和哈希
  const cleanPath = path.split('?')[0].split('#')[0];

  // 必须是相对路径，不能是绝对 URL
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('//')) {
    return null;
  }

  // 必须是应用内的路径
  if (!cleanPath.startsWith('/')) {
    return null;
  }

  // 防止路径遍历攻击
  if (cleanPath.includes('..') || cleanPath.includes('//')) {
    return null;
  }

  // 限制路径长度
  if (cleanPath.length > 200) {
    return null;
  }

  return cleanPath;
}

/**
 * 验证项目名称
 * @param {string} projectName - 项目名称
 * @returns {{ valid: boolean; message?: string }}
 */
export function validateProjectName(projectName) {
  if (!projectName || typeof projectName !== 'string') {
    return { valid: false, message: '项目名称不能为空' };
  }

  const trimmed = projectName.trim();

  if (trimmed.length < 1) {
    return { valid: false, message: '项目名称不能为空' };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: '项目名称不能超过100个字符' };
  }

  // 防止路径遍历和特殊字符
  if (/[<>:"/\\|?*]/.test(trimmed)) {
    return { valid: false, message: '项目名称包含非法字符' };
  }

  return { valid: true };
}

/**
 * 验证用户输入（通用）
 * @param {string} input - 输入内容
 * @param {Object} options - 选项
 * @param {number} [options.maxLength=1000] - 最大长度
 * @param {boolean} [options.allowHtml=false] - 是否允许 HTML
 * @returns {{ valid: boolean; message?: string; sanitized?: string }}
 */
export function validateInput(input, options = {}) {
  const { maxLength = 1000, allowHtml = false } = options;

  if (typeof input !== 'string') {
    return { valid: false, message: '输入必须是字符串' };
  }

  if (input.length > maxLength) {
    return { valid: false, message: `输入不能超过${maxLength}个字符` };
  }

  const sanitized = allowHtml ? input : sanitizeInput(input, maxLength);

  return { valid: true, sanitized };
}

/**
 * 生成安全的随机字符串（用于 CSRF token 等）
 * @param {number} [length=32] - 长度
 * @returns {string}
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 检查是否为生产环境
 * @returns {boolean}
 */
export function isProduction() {
  return import.meta.env.PROD || import.meta.env.MODE === 'production';
}

/**
 * 安全地记录日志（生产环境不记录敏感信息）
 * @param {string} message - 日志消息
 * @param {unknown} [data] - 数据
 */
export function safeLog(message, data) {
  // 日志功能已禁用
}
