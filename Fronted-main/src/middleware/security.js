/**
 * 全局安全中间件
 * 提供 CSP、XSS 防护等全局安全措施
 */

import { useEffect } from 'react';
import { isProduction } from '../utils/security';

/**
 * 设置内容安全策略（CSP）Meta 标签
 */
export function setupCSP() {
  useEffect(() => {
    // 移除旧的 CSP meta 标签
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    // 创建新的 CSP meta 标签
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 开发环境需要
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* https://*", // API 连接
      "frame-ancestors 'none'", // 防止点击劫持
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    document.head.appendChild(cspMeta);

    return () => {
      if (cspMeta.parentNode) {
        cspMeta.parentNode.removeChild(cspMeta);
      }
    };
  }, []);
}

/**
 * 设置安全响应头（通过 Meta 标签模拟）
 */
export function setupSecurityHeaders() {
  useEffect(() => {
    // 设置 X-Frame-Options（防止点击劫持）
    const frameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!frameOptions) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Frame-Options';
      meta.content = 'DENY';
      document.head.appendChild(meta);
    }

    // 设置 X-Content-Type-Options（防止 MIME 类型嗅探）
    const contentTypeOptions = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!contentTypeOptions) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Content-Type-Options';
      meta.content = 'nosniff';
      document.head.appendChild(meta);
    }

    // 设置 Referrer-Policy（控制 referrer 信息）
    const referrerPolicy = document.querySelector('meta[name="referrer"]');
    if (!referrerPolicy) {
      const meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(meta);
    }
  }, []);
}

/**
 * 全局安全组件
 * 在 App 组件中使用，提供全局安全防护
 */
export function SecurityProvider({ children }) {
  // 设置 CSP
  useEffect(() => {
    // 移除旧的 CSP meta 标签
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    // 创建新的 CSP meta 标签
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 开发环境需要
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* https://*", // API 连接
      "frame-ancestors 'none'", // 防止点击劫持
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    document.head.appendChild(cspMeta);

    return () => {
      if (cspMeta.parentNode) {
        cspMeta.parentNode.removeChild(cspMeta);
      }
    };
  }, []);

  // 设置安全响应头
  useEffect(() => {
    // 设置 X-Frame-Options（防止点击劫持）
    const frameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!frameOptions) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Frame-Options';
      meta.content = 'DENY';
      document.head.appendChild(meta);
    }

    // 设置 X-Content-Type-Options（防止 MIME 类型嗅探）
    const contentTypeOptions = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!contentTypeOptions) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Content-Type-Options';
      meta.content = 'nosniff';
      document.head.appendChild(meta);
    }

    // 设置 Referrer-Policy（控制 referrer 信息）
    const referrerPolicy = document.querySelector('meta[name="referrer"]');
    if (!referrerPolicy) {
      const meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(meta);
    }
  }, []);

  // 禁用右键菜单（可选，根据需要启用）
  useEffect(() => {
    if (isProduction()) {
      const handleContextMenu = (e) => {
        // 可以在这里添加额外的安全措施
        // e.preventDefault(); // 取消注释以禁用右键菜单
      };

      document.addEventListener('contextmenu', handleContextMenu);
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  // 防止开发者工具（可选，仅生产环境）
  useEffect(() => {
    if (isProduction()) {
      // 检测开发者工具（简单检测，可被绕过）
      const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
          // 可以在这里添加处理逻辑，但不建议完全阻止
          // 因为会影响用户体验
        }
      };

      const interval = setInterval(checkDevTools, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return children;
}
