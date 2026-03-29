import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} root 项目根目录
 */
export function getDownloadsPaths(root) {
  const downloadsDir = path.join(root, 'public', 'downloads');
  const stashDir = path.join(root, '.android-stash', 'public-downloads');
  return { downloadsDir, stashDir };
}

/**
 * @param {string} root
 */
export function recoverOrphanStash(root) {
  const { downloadsDir, stashDir } = getDownloadsPaths(root);
  if (fs.existsSync(downloadsDir)) return;
  if (fs.existsSync(stashDir)) {
    console.warn(
      '[stash] 检测到上次异常退出留下的缓存，正在恢复 public/downloads …',
    );
    fs.mkdirSync(path.dirname(downloadsDir), { recursive: true });
    fs.renameSync(stashDir, downloadsDir);
  }
}

/**
 * @param {string} root
 * @param {string} logTag
 */
export function createStashController(root, logTag = '[stash]') {
  let didStash = false;
  const { downloadsDir, stashDir } = getDownloadsPaths(root);
  return {
    stash() {
      if (!fs.existsSync(downloadsDir)) return;
      fs.mkdirSync(path.dirname(stashDir), { recursive: true });
      if (fs.existsSync(stashDir)) {
        fs.rmSync(stashDir, { recursive: true, force: true });
      }
      fs.renameSync(downloadsDir, stashDir);
      didStash = true;
      console.warn(`${logTag} 已临时移走 public/downloads（避免大文件打进移动端产物）`);
    },
    restore() {
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
          `${logTag} 恢复 public/downloads 失败，请手动将 .android-stash/public-downloads 移回 public/downloads`,
          e,
        );
      }
      didStash = false;
    },
  };
}
