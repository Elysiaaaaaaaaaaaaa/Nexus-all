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
  // 设置 CSP（仅生产构建：开发环境不覆盖 index.html，避免阻断 Vite HMR 的 blob Worker 与跨域视频调试）
  useEffect(() => {
    if (import.meta.env.DEV) {
      return undefined;
    }

    // 移除旧的 CSP meta 标签
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    // worker-src 未设置时回退到 script-src，须显式允许 blob:，否则 Web Worker / Vite 类 worker 会被阻断
    // media-src 未设置时回退到 default-src，须允许 http(s) 以便 <video src> 指向 API 或 CDN
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      // blob: 供 Vite preview / 部分 Web Worker；未显式设置 worker-src 时浏览器会用 script-src 校验 Worker
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "media-src 'self' data: blob: http: https:",
      "worker-src 'self' blob:",
      "connect-src 'self' http://localhost:* http://127.0.0.1:* http://101.200.1.56:* https://* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*",
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
