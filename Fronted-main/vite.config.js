import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** 默认代理到云端 http://101.200.1.56（与 .env 一致）；本机调试改 .env 中 VITE_DEV_PROXY_TARGET */
  const devProxyTarget =
    env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://101.200.1.56';

  const outDir = mode === 'miniprogram' ? 'dist-miniprogram' : 'dist';
  const base =
    mode === 'miniprogram' ? env.VITE_MINIPROGRAM_BASE || '/' : '/';

  return {
    base,
    plugins: [react()],
    build: {
      outDir,
    },
    server: {
      port: 5173,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/dist-miniprogram/**',
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
