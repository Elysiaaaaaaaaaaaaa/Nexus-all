/**
 * 头像工具函数
 * 使用 DiceBear API 生成用户头像
 */

/**
 * 生成 DiceBear 头像 URL
 * @param {string} username - 用户名，用于生成唯一头像
 * @param {string} [style='bottts-neutral'] - 头像风格，默认为 bottts-neutral
 * @returns {string} 头像 URL
 */
export function generateAvatarUrl(username, style = 'bottts-neutral') {
  if (!username || typeof username !== 'string') {
    // 如果没有用户名，使用默认值
    username = 'User';
  }

  // 清理用户名，移除特殊字符，只保留字母数字和常见字符
  const cleanUsername = username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 50); // 限制长度

  // 如果清理后为空，使用默认值
  const seed = cleanUsername || 'User';

  // 生成 DiceBear 头像 URL
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * 获取用户头像 URL
 * 如果用户上传了头像，使用上传的头像；否则使用生成的 DiceBear 头像
 * @param {string|null|undefined} uploadedAvatarUrl - 用户上传的头像 URL
 * @param {string} username - 用户名
 * @param {string} [style='bottts-neutral'] - 头像风格
 * @returns {string} 头像 URL
 */
export function getUserAvatarUrl(uploadedAvatarUrl, username, style = 'bottts-neutral') {
  // 如果用户上传了头像，优先使用上传的头像
  if (uploadedAvatarUrl && typeof uploadedAvatarUrl === 'string' && uploadedAvatarUrl.trim()) {
    return uploadedAvatarUrl;
  }

  // 否则使用生成的 DiceBear 头像
  return generateAvatarUrl(username, style);
}
