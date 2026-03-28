import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** 与 /api 同源：FastAPI 在同进程挂载 /api 与 /videos，本地调试可设 .env 中 VITE_API_BASE_URL=http://127.0.0.1:8003 */
  const devProxyTarget =
    env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://101.200.1.56';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/android/**',
          '**/*.zip',
        ],
      },
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/videos': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
