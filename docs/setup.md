# 开发环境搭建指南

本文档介绍智能安全报警器项目的完整开发环境搭建流程，涵盖 H5 端和 App 端（Android/iOS）开发所需的全部工具和配置。

---

## 一、环境要求概览

| 工具 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | >= 18（项目通过 `.nvmrc` 锁定为 18） | 项目构建与依赖管理 |
| npm | >= 9（随 Node.js 18 自带） | 包管理器 |
| HBuilderX | 最新正式版 | App 端开发、调试、打包 |
| Android Studio | 最新稳定版 | Android SDK 管理、模拟器 |
| Android SDK | API Level 30+（推荐 31） | Android 应用编译 |
| Xcode | 14+（仅 macOS） | iOS 开发与调试 |

---

## 二、Node.js 安装与配置

### 2.1 安装 Node.js 18

推荐使用 nvm（Node Version Manager）管理 Node.js 版本：

**Windows（nvm-windows）**：

1. 下载 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) 安装包
2. 安装完成后打开终端：

```bash
nvm install 18
nvm use 18
```

**macOS / Linux（nvm）**：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重启终端后安装 Node.js
nvm install 18
nvm use 18
```

项目根目录已包含 `.nvmrc` 文件（内容为 `18`），进入项目目录后执行 `nvm use` 即可自动切换到正确版本。

### 2.2 验证安装

```bash
node -v   # 应输出 v18.x.x
npm -v    # 应输出 9.x.x 或更高
```

---

## 三、HBuilderX 安装与配置

HBuilderX 是 DCloud 官方推出的 uni-app 开发 IDE，用于 App 端的开发、调试和打包。

### 3.1 下载安装

1. 访问 [HBuilderX 官网](https://www.dcloud.io/hbuilderx.html)
2. 下载 **正式版**（推荐）或 Alpha 版
3. Windows：解压到任意目录（路径中避免中文和空格）
4. macOS：拖入 Applications 文件夹

### 3.2 首次配置

1. 启动 HBuilderX，登录或注册 DCloud 账号
2. 安装必要插件：
   - **uni-app（Vue3）编译器**：菜单 → 工具 → 插件安装，搜索安装
   - **App 真机运行插件**：首次运行到手机时会自动提示安装
3. 导入项目：文件 → 导入 → 从本地目录导入，选择项目根目录

### 3.3 配置说明

项目的 `src/manifest.json` 已配置好以下内容：

- 应用名称、版本号、描述
- Android 权限声明（蓝牙、定位、短信、电话、通知等）
- iOS 权限用途说明
- 原生模块（Bluetooth、SQLite）

一般情况下无需手动修改 manifest.json，除非需要更改包名或添加新的原生模块。

---

## 四、Android SDK 配置（App 端开发）

> 如果只做 H5 端开发，可跳过本节。

### 4.1 安装 Android Studio

1. 访问 [Android Studio 官网](https://developer.android.com/studio) 下载安装
2. 安装时勾选：Android Studio、Android SDK、Android Virtual Device (AVD)
3. 完成初始化向导

### 4.2 配置 SDK

打开 Android Studio → **File** → **Settings** → **Languages & Frameworks** → **Android SDK**：

**SDK Platforms**（勾选安装）：
- Android 11.0 (R) — API Level 30（最低要求）
- Android 12.0 (S) — API Level 31（推荐）

**SDK Tools**（确保已安装）：
- Android SDK Build-Tools
- Android SDK Platform-Tools（包含 `adb`）
- Android Emulator
- Intel HAXM（Intel CPU）或 Android Emulator Hypervisor Driver（AMD CPU）

### 4.3 配置环境变量

将以下路径添加到系统 `Path` 环境变量：

**Windows**：
```
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

**macOS / Linux**：
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk   # macOS
export ANDROID_HOME=$HOME/Android/Sdk           # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

验证：
```bash
adb version
emulator -version
```

### 4.4 创建模拟器

1. Android Studio → **Tools** → **Device Manager** → **Create Device**
2. 选择设备模板：推荐 Pixel 4 或 Pixel 6
3. 选择系统镜像：API Level 31，x86_64 架构
4. 高级设置：RAM ≥ 2048 MB，Internal Storage ≥ 2048 MB

详细的模拟器调试配置请参考 [模拟器调试文档](./debug-emulator.md)。

### 4.5 真机调试

Android 真机调试需要：
1. 手机开启开发者模式和 USB 调试
2. 通过 USB 连接电脑，`adb devices` 确认设备已识别
3. HBuilderX 中运行到 Android App 基座

详细步骤请参考 [真机调试文档](./debug-device.md)。

---

## 五、项目依赖安装

### 5.1 安装依赖

```bash
# 进入项目目录
cd smart-safety-alarm

# 如果使用 nvm，自动切换 Node.js 版本
nvm use

# 安装所有依赖
npm install
```

### 5.2 核心依赖说明

| 依赖 | 说明 |
|------|------|
| `vue` | Vue 3 核心框架 |
| `pinia` | Vue 3 状态管理 |
| `vue-i18n` | 国际化（中英文双语） |
| `@dcloudio/uni-app` | uni-app 核心运行时 |
| `@dcloudio/uni-app-plus` | App 端运行时 |
| `@dcloudio/uni-h5` | H5 端运行时 |

### 5.3 开发依赖说明

| 依赖 | 说明 |
|------|------|
| `typescript` | TypeScript 编译器 |
| `vite` | 构建工具 |
| `vitest` | 单元测试框架 |
| `fast-check` | 属性测试库 |
| `@vue/test-utils` | Vue 组件测试工具 |
| `@dcloudio/vite-plugin-uni` | uni-app Vite 插件 |
| `vue-tsc` | Vue TypeScript 类型检查 |

---

## 六、NPM 脚本命令

项目 `package.json` 中定义了以下常用脚本命令：

### 6.1 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | 启动 H5 开发服务器（端口 5173），支持热更新 |
| `npm run dev:app` | 编译 App 端开发资源，配合 HBuilderX 运行到模拟器或真机 |
| `npm run dev:custom` | 自定义平台开发，需追加平台参数（如 `npm run dev:custom mp-weixin`） |

### 6.2 构建命令

| 命令 | 说明 |
|------|------|
| `npm run build:h5` | 构建 H5 生产包，输出到 `dist/build/h5` |
| `npm run build:custom -- app` | 构建 App 生产资源，配合 HBuilderX 打包为 APK/IPA |

### 6.3 测试命令

| 命令 | 说明 |
|------|------|
| `npm run test` | 运行所有单元测试和属性测试（单次执行） |
| `npm run test:watch` | 以监听模式运行测试，文件变更时自动重跑 |
| `npm run test:coverage` | 运行测试并生成代码覆盖率报告 |

### 6.4 代码质量命令

| 命令 | 说明 |
|------|------|
| `npm run type-check` | TypeScript 类型检查（`vue-tsc --noEmit`） |

---

## 七、代码风格配置

项目使用以下工具统一代码风格：

### 7.1 EditorConfig

`.editorconfig` 文件确保不同编辑器使用一致的基础格式：
- 缩进：2 个空格
- 字符编码：UTF-8
- 行尾：LF
- 文件末尾插入空行

大多数编辑器（VS Code、WebStorm、HBuilderX）原生支持或通过插件支持 EditorConfig。

### 7.2 Prettier

`.prettierrc` 文件定义代码格式化规则：
- 不使用分号
- 使用单引号
- 行宽 100 字符
- 尾随逗号（all）
- Vue 文件使用 vue 解析器

VS Code 用户建议安装 [Prettier 扩展](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)，并在设置中启用保存时自动格式化：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 八、快速开始

完成环境搭建后，按以下步骤启动开发：

```bash
# 1. 克隆项目
git clone <仓库地址>
cd smart-safety-alarm

# 2. 切换 Node.js 版本
nvm use

# 3. 安装依赖
npm install

# 4. 启动 H5 开发服务
npm run dev:h5
# 浏览器访问 http://localhost:5173

# 5. 运行测试
npm run test

# 6. 类型检查
npm run type-check
```

App 端开发：
```bash
# 1. 编译 App 资源
npm run dev:app

# 2. 在 HBuilderX 中打开项目，运行到模拟器或真机
```

---

## 九、常见问题排查

### Q: `npm install` 失败或速度很慢

切换到国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: H5 端启动后页面空白

1. 确认 Node.js 版本 >= 18（`node -v`）
2. 删除 `node_modules` 和 `package-lock.json`，重新 `npm install`
3. 清除浏览器缓存后刷新

### Q: `npm run dev:h5` 端口被占用

修改 `vite.config.ts` 中的 `server.port`，或使用环境变量：
```bash
# Windows
set PORT=3000 && npm run dev:h5

# macOS / Linux
PORT=3000 npm run dev:h5
```

### Q: TypeScript 类型报错

1. 确认 `@dcloudio/types` 已安装
2. 运行 `npm run type-check` 查看具体错误
3. 检查 `tsconfig.json` 中的 `paths` 配置是否正确

### Q: HBuilderX 无法识别模拟器

1. 确认模拟器已启动
2. 运行 `adb devices` 检查连接状态
3. 如果列表为空，执行 `adb kill-server && adb start-server` 后重试

### Q: App 端蓝牙功能不可用

1. 模拟器的 BLE 支持有限，完整蓝牙测试需使用真机
2. 确认 `manifest.json` 中已声明蓝牙相关权限
3. Android 12+ 需要运行时申请 `BLUETOOTH_SCAN` 和 `BLUETOOTH_CONNECT` 权限
4. 检查手机蓝牙是否已开启

### Q: 热更新（HMR）不生效

1. 检查 `vite.config.ts` 中 `server.hmr` 配置
2. 确认浏览器未禁用 WebSocket 连接
3. 部分防火墙或代理可能阻断 HMR 连接，尝试关闭后重试

---

## 十、相关文档

- [模拟器调试配置](./debug-emulator.md) — Android 模拟器创建与 HBuilderX 连接
- [真机调试指南](./debug-device.md) — Android/iOS 真机调试配置
- [项目 README](../README.md) — 项目概述与快速参考
