/**
 * 将 Tauri NSIS 安装包复制到 public/downloads，供官网静态下载。
 * 用法：pnpm run copy:installer（需先 pnpm run tauri:build）
 *
 * 注意：打 Android APK 请用 pnpm run build:android（会临时移走本目录，避免 .exe 打进 APK）。
 * 网站部署用 pnpm run build 即可（可保留 public/downloads）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(
  root,
  'src-tauri',
  'target',
  'release',
  'bundle',
  'nsis',
  'nexus-best_0.1.0_x64-setup.exe',
);
const dest = path.join(root, 'public', 'downloads', 'nexus-best_0.1.0_x64-setup.exe');

if (!fs.existsSync(src)) {
  console.warn('[copy-installer] 未找到安装包，请先执行: pnpm run tauri:build');
  console.warn('[copy-installer]', src);
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('[copy-installer] 已复制到', dest);
