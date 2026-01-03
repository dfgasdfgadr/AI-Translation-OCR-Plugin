# AI 浏览器翻译插件开发计划

根据您的需求文档，我制定了以下分阶段开发计划。当前项目目录为空，我们将从零开始构建。

## Phase 1: 项目初始化与基础架构
1.  **初始化项目**: 使用 Vite 创建 React + TypeScript 项目。
2.  **集成 TailwindCSS**: 配置 TailwindCSS 以便快速开发 UI。
3.  **配置 Chrome Extension 环境**: 安装 `@crxjs/vite-plugin`，配置 `vite.config.ts` 和 `manifest.json` (Manifest V3)。
4.  **目录结构规范化**: 建立 `src/popup`, `src/options`, `src/background`, `src/content` 等核心目录。

## Phase 2: 核心 UI 模块 (Popup & Options)
1.  **Options 页面**: 实现 API Key 配置界面（支持 OpenAI/Gemini Key 输入并保存到 `chrome.storage`）。
2.  **Popup 页面**: 
    *   文本输入框与翻译结果展示区。
    *   语言切换组件 (CN <-> EN)。
    *   图片粘贴区域（支持剪贴板图片读取）。

## Phase 3: 文本翻译功能 (Background & Content Script)
1.  **Background Service**: 
    *   实现 API 请求代理（解决跨域问题）。
    *   对接 LLM 翻译接口（OpenAI/Gemini）。
2.  **Content Script**:
    *   监听文本选中事件。
    *   实现“选中即译”逻辑。
    *   开发注入页面的翻译浮窗/侧边栏 UI (Shadow DOM 隔离样式)。

## Phase 4: OCR 与截图翻译功能
1.  **截图工具**: 实现全屏 Overlay，支持拖拽选区截图 (`chrome.tabs.captureVisibleTab`)。
2.  **OCR 集成**: 引入 `tesseract.js`，实现本地或云端 OCR 识别。
3.  **图片处理流程**: 截图/粘贴 -> OCR 识别 -> 文本翻译 -> 结果展示。

## Phase 5: 快捷键与优化
1.  **快捷键配置**: 在 Manifest 中注册 `Alt+T` (翻译) 和 `Alt+S` (截图)。
2.  **交互优化**: 添加 Loading 状态、错误处理、智能语言检测。
3.  **最终构建与测试**: 确保插件可成功加载到 Chrome 并正常运行。
