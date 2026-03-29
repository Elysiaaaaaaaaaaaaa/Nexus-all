/**
 * 运行渠道（与打包产物一一对应）
 *
 * Web 端：
 * - WEB_BROWSER：部署在服务器、浏览器访问的站点
 * - DESKTOP_TAURI：Tauri 打包的 Windows / macOS / Linux 桌面客户端
 *
 * Mobile 端：
 * - ANDROID_APP：Capacitor 打包的 Android（WebView 壳）
 * - WECHAT_MINIPROGRAM：微信小程序内嵌 H5，或构建时 VITE_RUNTIME_CHANNEL=wechat_miniprogram
 * - NATIVE_IOS：Capacitor iOS（若启用）
 */
import { Capacitor } from '@capacitor/core';

export const RUNTIME_KIND = {
  ANDROID_APP: 'android_app',
  WEB_BROWSER: 'web_browser',
  DESKTOP_TAURI: 'desktop_tauri',
  WECHAT_MINIPROGRAM: 'wechat_miniprogram',
  NATIVE_IOS: 'native_ios',
};

/** @returns {boolean} */
function isTauriDesktop() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.TAURI_PLATFORM) {
    return true;
  }
  if (typeof window === 'undefined') return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

/** @returns {boolean} */
function isWechatMiniprogramRuntime() {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_RUNTIME_CHANNEL === 'wechat_miniprogram'
  ) {
    return true;
  }
  if (typeof window === 'undefined') return false;
  return window.__wxjs_environment === 'miniprogram';
}

/**
 * 当前运行渠道
 * @returns {typeof RUNTIME_KIND[keyof typeof RUNTIME_KIND]}
 */
export function getRuntimeKind() {
  if (isTauriDesktop()) {
    return RUNTIME_KIND.DESKTOP_TAURI;
  }
  if (isWechatMiniprogramRuntime()) {
    return RUNTIME_KIND.WECHAT_MINIPROGRAM;
  }
  if (Capacitor.isNativePlatform()) {
    const p = Capacitor.getPlatform();
    if (p === 'android') return RUNTIME_KIND.ANDROID_APP;
    if (p === 'ios') return RUNTIME_KIND.NATIVE_IOS;
  }
  return RUNTIME_KIND.WEB_BROWSER;
}

/** @returns {boolean} */
export function isWebBrowserSite() {
  return getRuntimeKind() === RUNTIME_KIND.WEB_BROWSER;
}

/** @returns {boolean} */
export function isWebDesktopApp() {
  return getRuntimeKind() === RUNTIME_KIND.DESKTOP_TAURI;
}

/** Web 类渠道：浏览器站点或 Tauri 桌面（同源技术栈，与 Mobile 区分） */
export function isWebFamily() {
  const k = getRuntimeKind();
  return k === RUNTIME_KIND.WEB_BROWSER || k === RUNTIME_KIND.DESKTOP_TAURI;
}

/** Mobile 类渠道：Android / 微信小程序 / iOS */
export function isMobileFamily() {
  const k = getRuntimeKind();
  return (
    k === RUNTIME_KIND.ANDROID_APP ||
    k === RUNTIME_KIND.WECHAT_MINIPROGRAM ||
    k === RUNTIME_KIND.NATIVE_IOS
  );
}

/** @returns {boolean} */
export function isAndroidApp() {
  return getRuntimeKind() === RUNTIME_KIND.ANDROID_APP;
}

/** @returns {boolean} */
export function isWechatMiniprogramChannel() {
  return getRuntimeKind() === RUNTIME_KIND.WECHAT_MINIPROGRAM;
}

/**
 * 是否展示「下载 Windows 安装包」入口：仅浏览器站点；桌面端 / Android / 微信 / iOS 不展示
 * @returns {boolean}
 */
export function shouldShowWindowsInstallerDownload() {
  return getRuntimeKind() === RUNTIME_KIND.WEB_BROWSER;
}

/**
 * 首页 i18n 键（homepage.*）
 * @returns {'runtimeChannelAndroid'|'runtimeChannelWeb'|'runtimeChannelDesktop'|'runtimeChannelWechat'|'runtimeChannelIos'}
 */
export function getRuntimeChannelI18nKey() {
  switch (getRuntimeKind()) {
    case RUNTIME_KIND.ANDROID_APP:
      return 'runtimeChannelAndroid';
    case RUNTIME_KIND.DESKTOP_TAURI:
      return 'runtimeChannelDesktop';
    case RUNTIME_KIND.WECHAT_MINIPROGRAM:
      return 'runtimeChannelWechat';
    case RUNTIME_KIND.NATIVE_IOS:
      return 'runtimeChannelIos';
    default:
      return 'runtimeChannelWeb';
  }
}

/**
 * 是否使用移动端壳布局（底栏、移动首页等）：Capacitor 原生 或 微信小程序内 H5
 * @returns {boolean}
 */
export function isNativeMobileLayout() {
  const k = getRuntimeKind();
  return (
    k === RUNTIME_KIND.ANDROID_APP ||
    k === RUNTIME_KIND.NATIVE_IOS ||
    k === RUNTIME_KIND.WECHAT_MINIPROGRAM
  );
}

/** 在 documentElement 上打标，供全局 CSS / 调试 */
export function initNativeLayoutClassOnHtml() {
  if (typeof document === 'undefined') return;
  const kind = getRuntimeKind();
  let layout = 'web';
  if (kind === RUNTIME_KIND.ANDROID_APP || kind === RUNTIME_KIND.NATIVE_IOS) {
    layout = 'native-mobile';
  } else if (kind === RUNTIME_KIND.WECHAT_MINIPROGRAM) {
    layout = 'wechat-miniprogram';
  } else if (kind === RUNTIME_KIND.DESKTOP_TAURI) {
    layout = 'desktop-tauri';
  }
  document.documentElement.setAttribute('data-layout', layout);
  document.documentElement.classList.toggle('layout-native-mobile', layout === 'native-mobile');
  document.documentElement.classList.toggle('layout-wechat-miniprogram', layout === 'wechat-miniprogram');
  document.documentElement.classList.toggle('layout-desktop-tauri', layout === 'desktop-tauri');
  document.documentElement.classList.toggle('layout-web', layout === 'web');
}
