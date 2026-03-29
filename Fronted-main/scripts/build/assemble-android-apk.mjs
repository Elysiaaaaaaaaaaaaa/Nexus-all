/**
 * 在已完成 vite build + cap sync 的前提下执行 Gradle 打 APK。
 * 默认 assembleDebug；传 release 则打 release（需自行配置签名）。
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const androidRoot = path.join(root, 'android');

const mode = process.argv[2] === 'release' ? 'release' : 'debug';
const task = mode === 'release' ? 'assembleRelease' : 'assembleDebug';
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

execSync(`${gradlew} ${task}`, {
  cwd: androidRoot,
  stdio: 'inherit',
  shell: true,
});

const apkDir =
  mode === 'release'
    ? path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'release')
    : path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'debug');

console.log(`[android] ${task} 完成，APK 目录：`, apkDir);
