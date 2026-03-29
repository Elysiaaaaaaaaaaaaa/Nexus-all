# 首页背景视频（本站静态资源）

将 `test1.mp4`、`test2.mp4` 放在本目录，与 `Homepage.jsx` 中 `HERO_VIDEOS` 路径一致（`/hero-videos/...`）。

**不要用 `/videos/` 前缀**：开发环境下 Vite 会把 `/videos` 代理到后端 FastAPI（用户生成视频的 `user_files`），首页演示视频若仍放 `/videos/` 会 404 或被后端误处理。

大文件勿用 `import`，继续放 `public` 下由浏览器直链请求即可。
