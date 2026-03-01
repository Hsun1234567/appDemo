# 智能安全报警器

基于 uni-app（Vue 3 + TypeScript）的跨平台个人安全报警器应用，支持 H5 和 App（Android/iOS）双端。通过 BLE 蓝牙连接报警器硬件，实现紧急报警、GPS 定位、短信/电话求助等功能。所有数据本地存储，零服务器依赖。

## 环境要求

- Node.js >= 18
- HBuilderX（App 端开发/打包）
- Android Studio + Android SDK API 30+（Android 模拟器/真机调试）
- Xcode（iOS 开发，需 Mac 环境）

## 快速开始

```bash
# 安装依赖
npm install

# H5 端开发（浏览器）
npm run dev:h5

# App 端开发（需 HBuilderX 连接模拟器或真机）
npm run dev:app
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | 启动 H5 开发服务（端口 5173） |
| `npm run dev:app` | 生成 App 端开发资源 |
| `npm run build:h5` | 构建 H5 生产包 |
| `npm run build:custom -- app` | 构建 App 生产包 |
| `npm run test` | 运行单元测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run type-check` | TypeScript 类型检查 |

## 项目结构

```
src/
├── pages/          # 页面（首页、设备、设置、我的等）
├── components/     # 公共组件
├── stores/         # Pinia 状态管理
├── services/       # 服务层（BLE、定位、短信、电话等）
├── repositories/   # 数据访问层（Storage、SQLite）
├── models/         # TypeScript 类型定义
├── utils/          # 工具函数（平台检测、验证、模板）
├── config/         # 环境配置
├── i18n/           # 国际化（中文/英文）
├── static/         # 静态资源（知识库、音频）
├── manifest.json   # uni-app 应用配置
└── pages.json      # 页面路由与 tabBar 配置
```

## 多端差异

- **H5 端**：仅 UI 展示和数据管理，蓝牙/GPS/短信/电话等硬件功能隐藏
- **App 端**：完整功能，包括 BLE 蓝牙连接、GPS 定位、系统短信和电话调用

通过 uni-app 条件编译（`#ifdef APP-PLUS` / `#ifdef H5`）区分平台代码。

## 常见问题

### H5 端启动后页面空白
确认 Node.js 版本 >= 18，删除 `node_modules` 后重新 `npm install`。

### App 端模拟器无法连接
1. 确认 Android Studio 已安装且 AVD 已创建
2. 运行 `adb devices` 确认设备已识别
3. 在 HBuilderX 中选择对应模拟器运行

### 蓝牙功能在 H5 端不可用
这是预期行为。H5 端使用 `MockBLEService` 提供模拟数据，硬件功能入口已隐藏。

### TypeScript 类型报错
运行 `npm run type-check` 检查类型错误，确保 `@dcloudio/types` 已安装。

### 热更新不生效
检查 `vite.config.ts` 中 HMR 配置，确认浏览器未禁用 WebSocket 连接。
