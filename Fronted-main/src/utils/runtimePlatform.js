/**
 * 运行渠道（与打包产物一一对应，便于 Android / Web / Windows 桌面端分支逻辑）
 *
 * - ANDROID_APP：Capacitor 打包的 Android APK（原生壳 + WebView）
 * - WEB_BROWSER：浏览器中打开的站点（含手机浏览器访问同一部署）
 * - DESKTOP_TAURI：Tauri 打包的 Windows/macOS/Linux 桌面客户端（.exe 等）
 * - NATIVE_IOS：Capacitor 打包的 iOS（若后续启用）
 */
import { Capacitor } from '@capacitor/core';

export const RUNTIME_KIND = {
  ANDROID_APP: 'android_app',
  WEB_BROWSER: 'web_browser',
  DESKTOP_TAURI: 'desktop_tauri',
  NATIVE_IOS: 'native_ios',
};

/** @returns {boolean} */
function isTauriDesktop() {
  // Tauri 2 运行时常见全局；Vite 在 tauri dev/build 时会注入 TAURI_PLATFORM
  if (typeof import.meta !== 'undefined' && import.meta.env?.TAURI_PLATFORM) {
    return true;
  }
  if (typeof window === 'undefined') return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

/**
 * 当前运行渠道
 * @returns {typeof RUNTIME_KIND[keyof typeof RUNTIME_KIND]}
 */
export function getRuntimeKind() {
  if (isTauriDesktop()) {
    return RUNTIME_KIND.DESKTOP_TAURI;
  }
  if (Capacitor.isNativePlatform()) {
    const p = Capacitor.getPlatform();
    if (p === 'android') return RUNTIME_KIND.ANDROID_APP;
    if (p === 'ios') return RUNTIME_KIND.NATIVE_IOS;
  }
  return RUNTIME_KIND.WEB_BROWSER;
}

/**
 * 是否展示「下载 Windows 安装包」入口：仅 Web 站点；Android / iOS / 已在桌面端内则不展示
 * @returns {boolean}
 */
export function shouldShowWindowsInstallerDownload() {
  return getRuntimeKind() === RUNTIME_KIND.WEB_BROWSER;
}

/**
 * 首页 i18n 键（homepage.*）
 * @returns {'runtimeChannelAndroid'|'runtimeChannelWeb'|'runtimeChannelDesktop'|'runtimeChannelIos'}
 */
export function getRuntimeChannelI18nKey() {
  switch (getRuntimeKind()) {
    case RUNTIME_KIND.ANDROID_APP:
      return 'runtimeChannelAndroid';
    case RUNTIME_KIND.DESKTOP_TAURI:
      return 'runtimeChannelDesktop';
    case RUNTIME_KIND.NATIVE_IOS:
      return 'runtimeChannelIos';
    default:
      return 'runtimeChannelWeb';
  }
}

/**
 * 是否使用「原生 App 移动端」布局（Capacitor Android/iOS），与浏览器 Web 布局彻底分离
 * @returns {boolean}
 */
export function isNativeMobileLayout() {
  return Capacitor.isNativePlatform();
}

/** 在 documentElement 上打标，供全局 CSS / 调试 */
export function initNativeLayoutClassOnHtml() {
  if (typeof document === 'undefined') return;
  const native = isNativeMobileLayout();
  document.documentElement.setAttribute('data-layout', native ? 'native-mobile' : 'web');
  document.documentElement.classList.toggle('layout-native-mobile', native);
  document.documentElement.classList.toggle('layout-web', !native);
}
