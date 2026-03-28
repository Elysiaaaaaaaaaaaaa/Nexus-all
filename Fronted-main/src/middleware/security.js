/**
 * 全局安全中间件
 * 提供 CSP、XSS 防护等全局安全措施
 */

import { useEffect } from 'react';
import { isProduction } from '../utils/security';

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
      "connect-src 'self' http://localhost:* http://127.0.0.1:* http://101.200.1.56:* https://* ws://localhost:* wss://localhost:*",
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

  // 设置安全响应头（仅对 meta 中有效的项）
  useEffect(() => {
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
      const handleContextMenu = () => {
        // 可以在这里添加额外的安全措施
        // e.preventDefault(); // 取消注释以禁用右键菜单
      };

      document.addEventListener('contextmenu', handleContextMenu);
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  return children;
}
