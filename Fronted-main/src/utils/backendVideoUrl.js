/**
 * 后端静态视频：FastAPI 同应用挂载 /videos（与 /api 同主机端口）。
 * - 本地 dev：无 VITE_API_BASE_URL 时用相对路径 /videos/…，Vite 代理到 VITE_DEV_PROXY_TARGET 或默认云端。
 * - 打包（Web / Android / Tauri）：与 VITE_API_BASE_URL 同源；可单独设 VITE_VIDEO_ORIGIN（视频与 API 不同机时）。
 */

/**
 * @returns {string} 空串表示使用相对路径（走代理）
 */
function resolveVideoOrigin() {
  const explicit = import.meta.env.VITE_VIDEO_ORIGIN || import.meta.env.VITE_VIDEO_BASE_URL;
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* fallthrough */
    }
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  if (apiBase) {
    try {
      return new URL(apiBase).origin;
    } catch {
      /* fallthrough */
    }
  }
  if (import.meta.env.DEV) {
    return '';
  }
  /* 与 http.js 生产默认 API 主机一致；若视频单独端口请配置 VITE_VIDEO_ORIGIN */
  return 'http://101.200.1.56';
}

/**
 * 将后端返回的路径转为浏览器可请求的 URL
 * @param {unknown} input - 文件名、/videos/xxx、或完整 http(s) URL
 * @returns {string | null}
 */
export function resolveBackendVideoSrc(input) {
  const s = String(input ?? '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  let path = s.replace(/\\/g, '/');
  if (path.startsWith('/videos/')) {
    // ok
  } else if (path.toLowerCase().startsWith('videos/')) {
    path = `/${path}`;
  } else if (path.startsWith('/')) {
    path = `/videos${path}`;
  } else {
    path = `/videos/${path}`;
  }

  const origin = resolveVideoOrigin();
  if (!origin) {
    return path;
  }
  return `${origin}${path}`;
}

/**
 * @param {unknown} obj
 * @param {string[]} acc
 */
function pushVideoAddressFromObject(obj, acc) {
  if (!obj || typeof obj !== 'object') return;
  const va = obj.video_address;
  if (Array.isArray(va)) {
    for (const x of va) {
      if (x != null && String(x).trim() !== '') acc.push(String(x).trim());
    }
  } else if (typeof va === 'string' && va.trim() !== '') {
    acc.push(va.trim());
  }
}

/**
 * 从单个 material（对象或数组项）收集 video_address
 * @param {unknown} material
 * @returns {string[]}
 */
export function extractVideoPathsFromMaterial(material) {
  const raw = [];
  if (Array.isArray(material)) {
    for (const item of material) {
      pushVideoAddressFromObject(item, raw);
    }
  } else {
    pushVideoAddressFromObject(material, raw);
  }
  return [...new Set(raw)];
}

/**
 * 从 session_data 收集：顶层 material、以及 material 数组/对象内的 video_address
 * @param {unknown} sessionData
 * @returns {string[]}
 */
export function extractVideoPathsFromSessionData(sessionData) {
  if (!sessionData || typeof sessionData !== 'object') return [];
  const raw = [];
  pushVideoAddressFromObject(sessionData, raw);
  const m = sessionData.material;
  raw.push(...extractVideoPathsFromMaterial(m));
  return [...new Set(raw)];
}

/**
 * @param {unknown} sessionData
 * @returns {string[]}
 */
export function extractResolvedVideoUrlsFromSessionData(sessionData) {
  return extractVideoPathsFromSessionData(sessionData)
    .map(resolveBackendVideoSrc)
    .filter(Boolean);
}
