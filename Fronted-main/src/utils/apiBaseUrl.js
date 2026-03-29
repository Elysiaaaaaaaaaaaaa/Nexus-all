/**
 * 全站 API 根地址（与 FastAPI /api、/videos 同主机）。
 * 默认固定云端：http://101.200.1.56（Web / Tauri / Android 一致）。
 * 仅当需临时指向其它环境时，在 .env 中设置 VITE_API_BASE_URL。
 */
export const DEFAULT_API_ORIGIN = 'http://101.200.1.56';

/**
 * @returns {string} 无尾部斜杠
 */
export function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl != null && String(envUrl).trim() !== '') {
    return String(envUrl).trim().replace(/\/$/, '');
  }
  return DEFAULT_API_ORIGIN;
}
