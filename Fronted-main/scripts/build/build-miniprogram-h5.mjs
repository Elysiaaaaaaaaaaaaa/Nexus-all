/**
 * 微信小程序用 H5：与 Capacitor/Android 共用源码，构建产物输出到 dist-miniprogram，
 * 部署到 HTTPS 域名后，由小程序壳 web-view 加载（需在公众平台配置业务域名）。
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
const stash = createStashController(root, '[build:miniprogram:h5]');

try {
  stash.stash();
  execSync('pnpm exec vite build --mode miniprogram', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
} finally {
  stash.restore();
}
