import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // 减少监听范围：android / dist / 压缩包 文件极多，会明显拖慢 Windows 下 dev/HMR
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
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
