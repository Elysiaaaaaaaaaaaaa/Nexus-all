/**
 * 前端请求频率限制器
 * 防止暴力破解和频繁请求
 */

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.lockouts = new Map();
  }

  /**
   * 记录一次尝试
   * @param {string} key - 唯一标识（如 IP、用户名等）
   * @param {number} [maxAttempts=5] - 最大尝试次数
   * @param {number} [windowMs=15 * 60 * 1000] - 时间窗口（毫秒）
   * @param {number} [lockoutMs=30 * 60 * 1000] - 锁定时间（毫秒）
   * @returns {{ allowed: boolean; remaining?: number; lockoutUntil?: number }}
   */
  recordAttempt(key, maxAttempts = 5, windowMs = 15 * 60 * 1000, lockoutMs = 30 * 60 * 1000) {
    const now = Date.now();

    // 检查是否在锁定状态
    const lockoutUntil = this.lockouts.get(key);
    if (lockoutUntil && now < lockoutUntil) {
      return {
        allowed: false,
        lockoutUntil,
      };
    }

    // 清除过期的锁定
    if (lockoutUntil && now >= lockoutUntil) {
      this.lockouts.delete(key);
    }

    // 获取或创建尝试记录
    let attempts = this.attempts.get(key) || [];

    // 清除过期的尝试记录
    attempts = attempts.filter((timestamp) => now - timestamp < windowMs);

    // 检查是否超过最大尝试次数
    if (attempts.length >= maxAttempts) {
      // 锁定账户
      const newLockoutUntil = now + lockoutMs;
      this.lockouts.set(key, newLockoutUntil);
      this.attempts.delete(key);

      return {
        allowed: false,
        lockoutUntil: newLockoutUntil,
      };
    }

    // 记录本次尝试
    attempts.push(now);
    this.attempts.set(key, attempts);

    return {
      allowed: true,
      remaining: maxAttempts - attempts.length,
    };
  }

  /**
   * 清除尝试记录（登录成功后调用）
   * @param {string} key - 唯一标识
   */
  clearAttempts(key) {
    this.attempts.delete(key);
    this.lockouts.delete(key);
  }

  /**
   * 检查是否被锁定
   * @param {string} key - 唯一标识
   * @returns {{ locked: boolean; lockoutUntil?: number }}
   */
  isLocked(key) {
    const lockoutUntil = this.lockouts.get(key);
    const now = Date.now();

    if (lockoutUntil && now < lockoutUntil) {
      return {
        locked: true,
        lockoutUntil,
      };
    }

    if (lockoutUntil && now >= lockoutUntil) {
      this.lockouts.delete(key);
    }

    return { locked: false };
  }

  /**
   * 获取剩余尝试次数
   * @param {string} key - 唯一标识
   * @param {number} [maxAttempts=5] - 最大尝试次数
   * @param {number} [windowMs=15 * 60 * 1000] - 时间窗口
   * @returns {number}
   */
  getRemainingAttempts(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - validAttempts.length);
  }
}

// 导出单例
export const rateLimiter = new RateLimiter();
