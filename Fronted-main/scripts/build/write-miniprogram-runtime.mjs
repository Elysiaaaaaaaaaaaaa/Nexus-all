/**
 * 根据环境变量或 .env.miniprogram 中的 MINIPROGRAM_H5_URL 生成 miniprogram/config/runtime.js
 *（小程序 web-view 打开的 H5 入口，须 HTTPS 且已在微信后台配置业务域名）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

/**
 * @param {string} filePath
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = parseEnvFile(path.join(root, '.env.miniprogram'));
const h5Url =
  process.env.MINIPROGRAM_H5_URL || fileEnv.MINIPROGRAM_H5_URL || '';

const targetDir = path.join(root, 'miniprogram', 'config');
const target = path.join(targetDir, 'runtime.js');
const example = path.join(targetDir, 'runtime.example.js');

fs.mkdirSync(targetDir, { recursive: true });

if (h5Url) {
  fs.writeFileSync(
    target,
    `/* 由 scripts/build/write-miniprogram-runtime.mjs 生成，勿手改；改 URL 请设 MINIPROGRAM_H5_URL */\nmodule.exports = { h5Entry: ${JSON.stringify(h5Url)} };\n`,
  );
  console.log('[miniprogram] 已写入 config/runtime.js，h5Entry =', h5Url);
} else if (fs.existsSync(example)) {
  fs.copyFileSync(example, target);
  console.warn(
    '[miniprogram] 未配置 MINIPROGRAM_H5_URL，已复制 runtime.example.js → runtime.js，请修改为你的线上 H5 地址',
  );
} else {
  fs.writeFileSync(
    target,
    "module.exports = { h5Entry: 'https://your-h5-domain.example.com/' };\n",
  );
  console.warn(
    '[miniprogram] 已生成占位 runtime.js，请改为已部署 dist-miniprogram 的 HTTPS 地址',
  );
}
