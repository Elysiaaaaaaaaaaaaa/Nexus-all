/**
 * Android / Capacitor 专用构建：打 APK 前临时移走 public/downloads（避免 Windows .exe 打进 dist/APK）。
 * 网站部署仍用 pnpm run build（可保留 public/downloads）。
 *
 * 若上次构建异常退出，可能留下 .android-stash/public-downloads，启动时会先尝试恢复。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const downloadsDir = path.join(root, 'public', 'downloads');
const stashDir = path.join(root, '.android-stash', 'public-downloads');

function recoverOrphanStash() {
  if (fs.existsSync(downloadsDir)) return;
  if (fs.existsSync(stashDir)) {
    console.warn(
      '[build:android] 检测到上次异常退出留下的缓存，正在恢复 public/downloads …',
    );
    fs.mkdirSync(path.dirname(downloadsDir), { recursive: true });
    fs.renameSync(stashDir, downloadsDir);
  }
}

let didStash = false;

function stashDownloads() {
  if (!fs.existsSync(downloadsDir)) return;
  fs.mkdirSync(path.dirname(stashDir), { recursive: true });
  if (fs.existsSync(stashDir)) {
    fs.rmSync(stashDir, { recursive: true, force: true });
  }
  fs.renameSync(downloadsDir, stashDir);
  didStash = true;
  console.warn('[build:android] 已临时移走 public/downloads（不含进 APK），构建结束后自动还原');
}

function restoreDownloads() {
  if (!didStash) return;
  try {
    if (fs.existsSync(stashDir)) {
      if (fs.existsSync(downloadsDir)) {
        fs.rmSync(downloadsDir, { recursive: true, force: true });
      } else {
        fs.mkdirSync(path.dirname(downloadsDir), { recursive: true });
      }
      fs.renameSync(stashDir, downloadsDir);
    }
  } catch (e) {
    console.error(
      '[build:android] 恢复 public/downloads 失败，请手动将 .android-stash/public-downloads 移回 public/downloads',
      e,
    );
  }
  didStash = false;
}

recoverOrphanStash();

try {
  stashDownloads();
  execSync('pnpm exec vite build', { cwd: root, stdio: 'inherit', shell: true });
  execSync('npx cap sync android', { cwd: root, stdio: 'inherit', shell: true });
} finally {
  restoreDownloads();
}
