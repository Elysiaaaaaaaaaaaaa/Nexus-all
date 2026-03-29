/**
 * 后端静态视频：FastAPI 同应用挂载 /videos（与 /api 同主机端口）。
 * 默认与 resolveApiBaseUrl 同源（http://101.200.1.56）；可单独设 VITE_VIDEO_ORIGIN。
 */
import { resolveApiBaseUrl, DEFAULT_API_ORIGIN } from './apiBaseUrl';

/**
 * @returns {string} 视频源站 origin，默认 101.200.1.56
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
  try {
    return new URL(resolveApiBaseUrl()).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
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
  while (path.startsWith('./')) {
    path = path.slice(2);
  }

  /** 后端常把文件落在 user_files/ 下；静态挂载为 /videos/<相对 user_files 的路径> */
  const uf = /(?:^|[\\/])user_files\//i;
  const hit = uf.exec(path);
  if (hit) {
    const rest = path.slice(hit.index + hit[0].length).replace(/^\/+/, '');
    path = `/videos/${rest}`;
  } else if (path.startsWith('/videos/')) {
    /* ok */
  } else if (path.toLowerCase().startsWith('videos/')) {
    path = `/${path}`;
  } else if (path.startsWith('/')) {
    path = `/videos${path}`;
  } else {
    path = `/videos/${path}`;
  }

  path = path.replace(/\/videos\/\/+/g, '/videos/');

  const origin = resolveVideoOrigin();
  return `${origin}${path}`;
}

/**
 * 同一视频常被重复收集：正文里是 `/videos/...`，session 里是带域名的绝对 URL，
 * `Set` 按字符串去重会失败，导致两个 `<video>` 播同一文件。
 * 按 URL 的 pathname（及 search）合并，优先保留 https? 绝对地址。
 * @param {string[]} urls
 * @returns {string[]}
 */
export function dedupeResolvedVideoUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];
  /** @type {Map<string, string>} */
  const byPath = new Map();
  for (const raw of urls) {
    const r = resolveBackendVideoSrc(raw) || (typeof raw === 'string' ? raw.trim() : '');
    if (!r) continue;
    let pathKey;
    try {
      if (/^https?:\/\//i.test(r)) {
        const u = new URL(r);
        pathKey = `${u.pathname}${u.search}`;
      } else {
        pathKey = r.split('?')[0].replace(/\\/g, '/');
        if (!pathKey.startsWith('/')) pathKey = `/${pathKey}`;
      }
    } catch {
      pathKey = r;
    }
    const existing = byPath.get(pathKey);
    if (existing == null) {
      byPath.set(pathKey, r);
      continue;
    }
    if (/^https?:\/\//i.test(r) && !/^https?:\/\//i.test(existing)) {
      byPath.set(pathKey, r);
    }
  }
  return [...byPath.values()];
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
 * 从 session_data 收集：顶层 material、以及 material 数组/对象内的 video_address（与远程合并后保留完整收集）
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
 * 从文本内容中提取视频地址
 * @param {string} text
 * @returns {string[]}
 */
export function extractVideoPathsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  // 匹配视频文件路径或URL，包括各种格式的视频文件
  const videoPattern = /(?:https?:\/\/[^\s]+\.(?:mp4|avi|mov|wmv|flv|mkv|webm)|(?:\/videos\/[^\s]+|user_files\/[^\s]+)\.(?:mp4|avi|mov|wmv|flv|mkv|webm))/gi;
  const matches = text.match(videoPattern) || [];
  return [...new Set(matches.map(m => m.trim()))];
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

/**
 * 从文本内容中提取并解析视频URL
 * @param {string} text
 * @returns {string[]}
 */
export function extractResolvedVideoUrlsFromText(text) {
  return extractVideoPathsFromText(text)
    .map(resolveBackendVideoSrc)
    .filter(Boolean);
}
