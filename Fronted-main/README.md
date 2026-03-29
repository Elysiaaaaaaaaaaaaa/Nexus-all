# Nexus Fronted

Nexus Studio 前端：基于 **React 19**、**Vite 7**、**Tailwind CSS v4** 的多端应用。同一套业务代码可构建为 **浏览器站点**、**Tauri 桌面端**、**Capacitor Android** 与 **微信小程序内嵌 H5**（壳在 `miniprogram/`）。

## 目录结构

```text
.
├── src/                    # 应用源码（页面、组件、路由、状态、API）
├── public/                 # 静态资源（构建时拷贝；大体积视频建议放 public/videos，勿入库）
├── miniprogram/            # 微信小程序原生壳（web-view 加载线上 H5）
├── android/                # Capacitor Android 工程（勿手改 Web 资源目录，由 cap sync 同步）
├── src-tauri/              # Tauri 2 桌面壳（Rust + 前端 dist）
├── scripts/
│   ├── build/              # 各端构建与辅助（Android 同步、小程序 H5、runtime 写入、Gradle APK）
│   ├── release/            # 发布辅助（如安装包复制到 public/downloads）
│   └── lib/                # 构建脚本公共逻辑（如 public/downloads 暂存）
├── index.html              # Vite HTML 入口
├── vite.config.js          # Vite（含 miniprogram 模式 outDir: dist-miniprogram）
├── capacitor.config.json   # Capacitor（webDir: dist）
├── eslint.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example            # 环境变量说明模板
├── .env.production         # 生产构建（浏览器）
├── .env.tauri              # Tauri 构建（完整 API 地址）
└── .env.miniprogram        # 小程序 H5 构建 + MINIPROGRAM_H5_URL
```

### `src/` 内简要分工

| 路径 | 说明 |
|------|------|
| `src/pages/` | 页面；`pages/mobile/` 为原生壳内移动布局 |
| `src/components/` | 可复用组件 |
| `src/layouts/` | 布局（含 `MobileLayout`） |
| `src/contexts/` | React Context |
| `src/services/`、`src/utils/` | 请求与工具；`runtimePlatform.js` 区分运行渠道 |
| `src/i18n/` | 文案 |
| `src/middleware/` | 安全等中间层 |

## 环境要求

- **Node.js**（建议 LTS）与 **pnpm**
- **桌面端**：安装 **Rust** 与 Tauri 依赖，见 [Tauri 文档](https://tauri.app/start/prerequisites/)
- **Android APK**：**Android Studio** / SDK，配置好 `JAVA_HOME`
- **微信小程序**：**微信开发者工具**；H5 域名需 HTTPS 并在公众平台配置业务域名

## 快速开始

```bash
pnpm install
pnpm dev
```

默认开发服务器：`http://localhost:5173`，`/api` 与 `/videos` 由 `vite.config.js` 代理到后端（可用 `.env` 中 `VITE_DEV_PROXY_TARGET` / `VITE_API_BASE_URL` 覆盖）。

## 构建与运行渠道

| 类别 | 渠道 | 产物 / 说明 | 命令 |
|------|------|-------------|------|
| Web | 浏览器站点 | `dist/` | `pnpm run build` / `pnpm run build:web` |
| Web | 桌面（Tauri） | `src-tauri/target/release/bundle/…` | `pnpm run build:web:tauri` → `pnpm run build:desktop`（同 `tauri:build`） |
| Mobile | Android | `android/app/build/outputs/apk/…` | 同步 Web：`pnpm run build:mobile:android`；打 Debug APK：`pnpm run build:mobile:android:apk`；Release：`pnpm run build:mobile:android:apk:release` |
| Mobile | 微信小程序 | H5：`dist-miniprogram/`；壳：`miniprogram/` | 写入口 URL：`pnpm run build:mobile:miniprogram:config`；打 H5：`pnpm run build:mobile:miniprogram:h5`；一键：`pnpm run build:mobile:miniprogram` |

官网提供 Windows 安装包下载时：先 `pnpm run tauri:build`，再 `pnpm run copy:installer`（脚本在 `scripts/release/`）。

运行时渠道判断见 **`src/utils/runtimePlatform.js`**（`getRuntimeKind`、`isWebFamily`、`isMobileFamily` 等）。

## 环境变量

复制 **`.env.example`** 为 `.env` 并按环境调整。常用文件：

- **`.env.production`**：浏览器生产构建默认变量
- **`.env.tauri`**：桌面端无 Vite 代理，需配置 `VITE_API_BASE_URL` 等
- **`.env.miniprogram`**：小程序 H5 构建；可配置 `MINIPROGRAM_H5_URL` 供写入 `miniprogram/config/runtime.js`

## 代码规范

```bash
pnpm run lint
```

## 许可

以仓库内 LICENSE 为准（若未包含则由项目方自行补充）。
