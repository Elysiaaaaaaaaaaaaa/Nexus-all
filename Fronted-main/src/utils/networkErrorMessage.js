/**
 * 登录/注册等场景下，网络类错误（axios code 0 / 504）的提示文案
 */
export function getNetworkFailureMessage() {
  if (import.meta.env.DEV) {
    return '无法连接后端：请检查网络，或确认云端 http://101.200.1.56 可访问；若改用本机 API，请修改 .env 中 VITE_API_BASE_URL 后重启 dev。';
  }
  return '网络连接失败，请检查网络设置';
}
