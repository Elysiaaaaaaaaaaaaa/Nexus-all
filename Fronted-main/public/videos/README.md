# 首页背景视频

请将 `test1.mp4`、`test2.mp4` 放在本目录（与 `Homepage.jsx` 中 `HERO_VIDEOS` 路径一致）。

原先放在 `src/assets` 下并用 `import` 引用时，Vite 在开发模式会处理大体积视频，容易导致 `npm run dev` 卡顿；改为 `public/videos` 后由浏览器直接请求静态文件，开发会轻快很多。
