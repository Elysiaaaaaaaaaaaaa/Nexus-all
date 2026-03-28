/**
 * 历史记录列表展示：行配色与路由参数中的 project_name 解码
 */

const ROW_STYLES = [
  {
    color: 'rgb(219, 234, 254)',
    textColor: 'rgb(37, 99, 235)',
    badgeColor: 'rgb(219, 234, 254)',
    badgeBorder: 'rgb(191, 219, 254)',
    badgeText: 'rgb(37, 99, 235)',
  },
  {
    color: 'rgb(243, 232, 255)',
    textColor: 'rgb(147, 51, 234)',
    badgeColor: 'rgb(209, 250, 229)',
    badgeBorder: 'rgb(167, 243, 208)',
    badgeText: 'rgb(16, 185, 129)',
  },
  {
    color: 'rgb(255, 237, 213)',
    textColor: 'rgb(249, 115, 22)',
    badgeColor: 'rgb(241, 245, 249)',
    badgeBorder: 'rgb(226, 232, 240)',
    badgeText: 'rgb(100, 116, 139)',
  },
  {
    color: 'rgb(209, 250, 229)',
    textColor: 'rgb(16, 185, 129)',
    badgeColor: 'rgb(209, 250, 229)',
    badgeBorder: 'rgb(167, 243, 208)',
    badgeText: 'rgb(16, 185, 129)',
  },
  {
    color: 'rgb(254, 226, 226)',
    textColor: 'rgb(239, 68, 68)',
    badgeColor: 'rgb(209, 250, 229)',
    badgeBorder: 'rgb(167, 243, 208)',
    badgeText: 'rgb(16, 185, 129)',
  },
  {
    color: 'rgb(229, 231, 235)',
    textColor: 'rgb(107, 114, 128)',
    badgeColor: 'rgb(219, 234, 254)',
    badgeBorder: 'rgb(191, 219, 254)',
    badgeText: 'rgb(37, 99, 235)',
  },
  {
    color: 'rgb(243, 232, 255)',
    textColor: 'rgb(168, 85, 247)',
    badgeColor: 'rgb(209, 250, 229)',
    badgeBorder: 'rgb(167, 243, 208)',
    badgeText: 'rgb(16, 185, 129)',
  },
];

/**
 * @param {number} index
 */
export function historyRowStyleByIndex(index) {
  const i = Number.isFinite(index) ? index : 0;
  return ROW_STYLES[((i % ROW_STYLES.length) + ROW_STYLES.length) % ROW_STYLES.length];
}

/**
 * @param {string | undefined} param - 路由 :id（encodeURIComponent 后的 project_name）
 * @returns {string}
 */
export function decodeProjectRouteParam(param) {
  if (param == null || param === '') return '';
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

/**
 * @param {unknown} material
 * @returns {string}
 */
export function formatHistoryMaterial(material) {
  if (material == null || material === '') return '';
  if (typeof material === 'string') return material;
  try {
    return JSON.stringify(material, null, 2);
  } catch {
    return String(material);
  }
}

/**
 * @param {unknown} resp
 * @returns {Array<{ project_name: string; workflow_type?: string; now_task?: string }>}
 */
export function extractProjectsFromListResponse(resp) {
  if (!resp || typeof resp !== 'object') return [];
  const { projects } = resp;
  return Array.isArray(projects) ? projects : [];
}

/**
 * @param {unknown} resp
 * @returns {{ chat_history: Array<Record<string, unknown>>; session_data: Record<string, unknown> | null }}
 */
export function extractHistoryFromResponse(resp) {
  if (!resp || typeof resp !== 'object') {
    return { chat_history: [], session_data: null };
  }
  const chat = resp.chat_history;
  const session = resp.session_data;
  return {
    chat_history: Array.isArray(chat) ? chat : [],
    session_data: session && typeof session === 'object' ? session : null,
  };
}
