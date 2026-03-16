/**
 * API 响应包装类型
 * @template T 数据类型
 */
export class ApiEnvelope {
  /**
   * @param {Object} params
   * @param {number} params.code - 状态码
   * @param {string} params.message - 消息
   * @param {T} params.data - 数据
   * @param {string} [params.traceId] - 追踪ID
   */
  constructor({ code, message, data, traceId }) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.traceId = traceId;
  }
}

/**
 * 前端统一错误类型
 * - isSystemError=true：网络/超时/HTTP 500 等"系统层错误"
 * - isSystemError=false：后端返回 code!=0/200 等"业务错误"
 */
export class AppError extends Error {
  /**
   * @param {Object} params
   * @param {string} params.message - 错误消息
   * @param {number} params.code - 错误码
   * @param {boolean} [params.isSystemError] - 是否为系统错误
   * @param {unknown} [params.data] - 错误数据
   * @param {string} [params.traceId] - 追踪ID
   */
  constructor({ message, code, isSystemError = false, data, traceId }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isSystemError = isSystemError;
    this.data = data;
    this.traceId = traceId;

    // 兼容某些运行时下 Error 继承的原型链问题
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
