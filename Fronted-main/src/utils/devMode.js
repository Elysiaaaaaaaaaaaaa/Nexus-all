/**
 * 开发模式工具
 * 仅在开发环境生效，提供开发便利功能
 */

import { isProduction } from './security';

/**
 * 检查是否为开发模式
 * @returns {boolean}
 */
export function isDevMode() {
  return !isProduction();
}

/**
 * 开发模式快速登录（仅开发环境）
 * 绕过正常登录流程，直接设置测试用户
 */
export function devQuickLogin() {
  if (isProduction()) {
    return false;
  }

  try {
    // 设置测试用户信息
    const testUserId = 'dev_user_123';
    const testUserInfo = {
      username: 'dev_user',
      email: 'dev@example.com'
    };
    const testToken = 'dev_token_' + Date.now();

    localStorage.setItem('app-user-id', testUserId);
    localStorage.setItem('app-user-info', JSON.stringify(testUserInfo));
    localStorage.setItem('auth_token', testToken);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 开发模式清除所有数据（仅开发环境）
 */
export function devClearAll() {
  if (isProduction()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 开发模式禁用路由保护（仅开发环境）
 * 返回一个总是返回 true 的认证状态
 */
export function devBypassAuth() {
  if (isProduction()) {
    return false;
  }

  // 检查是否有开发模式标记
  const devBypass = localStorage.getItem('dev_bypass_auth') === 'true';
  return devBypass;
}

/**
 * 切换开发模式路由保护绕过
 */
export function toggleDevBypassAuth() {
  if (isProduction()) {
    return false;
  }

  const current = devBypassAuth();
  const newValue = !current;
  localStorage.setItem('dev_bypass_auth', String(newValue));
  
  return newValue;
}

/**
 * 开发模式禁用频率限制（仅开发环境）
 */
export function devBypassRateLimit() {
  if (isProduction()) {
    return false;
  }

  return localStorage.getItem('dev_bypass_rate_limit') === 'true';
}

/**
 * 切换开发模式频率限制绕过
 */
export function toggleDevBypassRateLimit() {
  if (isProduction()) {
    return false;
  }

  const current = devBypassRateLimit();
  const newValue = !current;
  localStorage.setItem('dev_bypass_rate_limit', String(newValue));
  
  return newValue;
}

/**
 * 在控制台显示开发模式帮助信息
 */
export function showDevHelp() {
  if (isProduction()) {
    return;
  }
  // 开发模式帮助信息已移除
}

// 在开发环境自动注册到 window 对象
if (isDevMode()) {
  if (typeof window !== 'undefined') {
    window.devQuickLogin = devQuickLogin;
    window.devClearAll = devClearAll;
    window.toggleDevBypassAuth = toggleDevBypassAuth;
    window.toggleDevBypassRateLimit = toggleDevBypassRateLimit;
    window.devHelp = showDevHelp;

    // 自动显示帮助信息
    if (localStorage.getItem('dev_help_shown') !== 'true') {
      showDevHelp();
      localStorage.setItem('dev_help_shown', 'true');
    }
  }
}
