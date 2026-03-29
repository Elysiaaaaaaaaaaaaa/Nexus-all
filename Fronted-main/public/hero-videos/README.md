# 首页背景视频（本站静态资源）

`Homepage.jsx` 使用 **`/hero-videos/test1.mp4`、`/hero-videos/test2.mp4`**（即本目录下的两个文件）。

## 为何不用 `public/videos/`？

开发时 Vite 会把 **`/videos` 整段代理到后端**（见 `vite.config.js`），浏览器访问 `/videos/xxx.mp4` 会打到 **FastAPI 的 user_files**，**不会**读到 `public/videos/` 里的静态文件，所以首页演示必须放在 **`/hero-videos/`**（不被代理）。

若你把素材放在 `public/videos/`，请**复制**到本目录并保持文件名与 `HERO_VIDEOS` 一致：

```text
public/videos/test1.mp4  →  public/hero-videos/test1.mp4
public/videos/test2.mp4  →  public/hero-videos/test2.mp4
```

大文件勿用 `import`，继续放 `public` 下由浏览器直链请求即可。`*.mp4` 默认被 `.gitignore` 忽略，需各环境自行放置。
