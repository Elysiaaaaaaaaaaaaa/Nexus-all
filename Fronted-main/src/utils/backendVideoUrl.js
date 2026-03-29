/**
 * 后端静态视频：FastAPI 同应用挂载 /videos（与 /api 同主机端口）。
 * - 浏览器本地 dev：无 VITE_API_BASE_URL 时用相对路径 /videos/…，Vite 代理。
 * - Capacitor 本地 dev：必须用绝对源站，否则 /videos 会落到 WebView 伪域导致 404。
 * - 打包（Web / Android / Tauri）：与 VITE_API_BASE_URL 同源；可单独设 VITE_VIDEO_ORIGIN。
 */
import { Capacitor } from '@capacitor/core';

/** 与 src/services/http.js DEFAULT_API_ORIGIN 保持一致 */
const DEFAULT_VIDEO_ORIGIN = 'http://101.200.1.56';

/**
 * @returns {string} 空串表示使用相对路径（仅浏览器 dev + Vite 代理）
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
  // 开发环境使用相对路径，让 Vite 代理处理
  if (import.meta.env.DEV) {
    return '';
  }
  // 生产环境使用默认的视频源站
  return DEFAULT_VIDEO_ORIGIN;
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
