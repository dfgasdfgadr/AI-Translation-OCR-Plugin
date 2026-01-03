# AI 浏览器翻译插件（英汉互译）开发计划

我们将开发一款基于 Chrome Extension Manifest V3 架构的浏览器插件，集成 AI 翻译（调用 LLM API）和 OCR 文字识别功能。

## 1. 技术栈选择
- **核心框架**: React + TypeScript (保证类型安全和组件化开发)
- **构建工具**: Vite + CRXJS (高效的开发体验和自动 Manifest 生成)
- **样式方案**: Tailwind CSS (快速构建现代化 UI)
- **OCR 引擎**: Tesseract.js (前端离线/在线识别) 或 预留 OCR API 接口
- **AI 接口**: 兼容 OpenAI 格式的 API 调用 (用户可配置 API Key)

## 2. 核心模块设计

### A. Manifest V3 配置
- **Permissions**: `storage` (保存设置), `activeTab` (访问当前页), `scripting` (注入脚本), `contextMenus` (右键菜单), `commands` (快捷键).
- **Background Service Worker**: 处理 API 请求、跨域代理、截图逻辑。
- **Content Scripts**: 处理页面文本选区、监听快捷键、渲染截图遮罩层。
- **Popup**: 主要交互界面，用于文本输入和图片粘贴。

### B. 功能模块详情

#### 1. 文本翻译 (Text Translation)
- **划词翻译**:
  - `Content Script` 监听用户选中文本动作。
  - 监听快捷键 (如 `Alt+T`) 或显示悬浮图标。
  - 发送消息给 Background，调用 AI 翻译接口。
  - 在选区附近显示 Shadow DOM 渲染的翻译气泡。
- **弹窗翻译**:
  - `Popup` 页面提供文本输入框。
  - 自动检测语言 (中文->英文 / 英文->中文)。

#### 2. 图片翻译 (Image Translation)
- **粘贴翻译**:
  - `Popup` 页面监听 `onPaste` 事件。
  - 读取剪贴板中的 `image/png` 数据。
  - 调用 OCR 引擎提取文本 -> 发送给 AI 翻译。
- **截图翻译**:
  - 通过快捷键 (如 `Alt+Shift+S`) 触发截图模式。
  - 在页面注入遮罩层 (Overlay) 供用户框选区域。
  - 获取框选坐标，使用 `chrome.tabs.captureVisibleTab` 截取当前视口，裁剪出目标区域。
  - 进行 OCR 识别和翻译。

#### 3. 设置与配置 (Settings)
- 配置 API Endpoint 和 API Key (支持用户自定义 LLM，如 DeepSeek, OpenAI 等)。
- 配置快捷键映射。

## 3. 开发步骤规划

### 阶段一：项目初始化与基础架构
1.  使用 Vite 初始化 React TypeScript 项目。
2.  配置 Manifest V3 及 Tailwind CSS。
3.  搭建 Popup 基础 UI (输入框、结果展示区、设置入口)。

### 阶段二：文本翻译功能实现
1.  实现 `Settings` 模块，允许保存 API Key。
2.  实现 `TranslationService` (封装 AI API 调用)。
3.  开发 `Content Script`，实现划词监听和简单的结果浮层。
4.  联调：Popup 输入翻译 & 页面划词翻译。

### 阶段三：图片 OCR 与翻译
1.  集成 `Tesseract.js` 到项目中。
2.  在 Popup 中实现图片粘贴、预览、识别、翻译的完整流程。
3.  优化 OCR 识别后的文本格式化（去除多余换行）。

### 阶段四：截图功能开发
1.  实现截图遮罩层组件 (Crop Overlay)。
2.  在 Background Script 中实现 `captureVisibleTab` 逻辑。
3.  串联流程：快捷键 -> 选区 -> 截图 -> OCR -> 翻译 -> 弹窗显示结果。

### 阶段五：UI 优化与测试
1.  美化 UI，增加 Loading 状态和错误处理。
2.  测试快捷键冲突和不同网页的兼容性。

请确认是否按照此计划开始开发？我们将优先完成**项目初始化**和**文本翻译**的核心链路。