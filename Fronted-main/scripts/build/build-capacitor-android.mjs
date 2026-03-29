/**
 * Android / Capacitor 专用构建：打 APK 前临时移走 public/downloads（避免 Windows .exe 打进 dist/APK）。
 * 网站部署仍用 pnpm run build（可保留 public/downloads）。
 *
 * 若上次构建异常退出，可能留下 .android-stash/public-downloads，启动时会先尝试恢复。
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recoverOrphanStash,
  createStashController,
} from '../lib/stashPublicDownloads.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

recoverOrphanStash(root);
const stash = createStashController(root, '[build:android]');

try {
  stash.stash();
  execSync('pnpm exec vite build', { cwd: root, stdio: 'inherit', shell: true });
  execSync('npx cap sync android', { cwd: root, stdio: 'inherit', shell: true });
} finally {
  stash.restore();
}
