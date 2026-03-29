/**
 * /api/v1/work 调试日志。
 * - 开发环境 (import.meta.env.DEV) 自动输出
 * - 生产环境可在控制台执行：localStorage.setItem('nexusDebugWork','1'); location.reload();
 * 关闭：localStorage.removeItem('nexusDebugWork'); location.reload();
 */

export function isWorkDebugEnabled() {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('nexusDebugWork') === '1';
  } catch {
    return false;
  }
}

/**
 * @param {string} label
 * @param {unknown} [data]
 */
export function workDebugLog(label, data) {
  if (!isWorkDebugEnabled()) return;
  if (data !== undefined) {
    console.log(`[work:${label}]`, data);
  } else {
    console.log(`[work:${label}]`);
  }
}
