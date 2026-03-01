# App 端模拟器调试配置（Windows）

本文档介绍如何在 Windows 环境下配置 Android 模拟器，并通过 HBuilderX 进行 App 端调试。

## 1. 安装 Android Studio 及 SDK

### 1.1 下载安装 Android Studio

1. 访问 [Android Studio 官网](https://developer.android.com/studio) 下载最新版本
2. 运行安装程序，勾选以下组件：
   - Android Studio
   - Android SDK
   - Android Virtual Device (AVD)
3. 安装完成后启动 Android Studio，完成初始化向导

### 1.2 配置 Android SDK

1. 打开 Android Studio → **File** → **Settings** → **Languages & Frameworks** → **Android SDK**
2. 在 **SDK Platforms** 标签页中，勾选安装：
   - **Android 11.0 (R)** — API Level 30（最低要求）
   - **Android 12.0 (S)** — API Level 31（推荐）
3. 在 **SDK Tools** 标签页中，确保以下工具已安装：
   - Android SDK Build-Tools
   - Android SDK Platform-Tools（包含 `adb`）
   - Android Emulator
   - Intel HAXM（Intel CPU）或 Android Emulator Hypervisor Driver（AMD CPU）
4. 点击 **Apply** 完成安装

### 1.3 配置环境变量

将以下路径添加到系统环境变量 `Path` 中：

```
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

验证配置：

```bash
adb version
emulator -version
```

## 2. 创建 Android 模拟器（AVD）

### 2.1 创建 AVD

1. 打开 Android Studio → **Tools** → **Device Manager**
2. 点击 **Create Device**
3. 选择设备模板：推荐 **Pixel 4** 或 **Pixel 6**
4. 选择系统镜像：**API Level 31**（Android 12），选择 **x86_64** 架构
5. 在 AVD 配置页面，点击 **Show Advanced Settings**，调整以下参数：
   - **RAM**: 2048 MB 或更高
   - **Internal Storage**: 2048 MB 或更高
   - **SD Card**: 512 MB
6. 点击 **Finish** 完成创建

### 2.2 启用 BLE 模拟支持

Android 模拟器从 API 31+ 开始提供有限的蓝牙模拟支持。配置方式：

1. 启动模拟器后，打开模拟器侧边栏 **Extended Controls**（`...` 按钮）
2. 进入 **Settings** → 确认蓝牙选项已启用

> **注意**：模拟器的 BLE 支持有限，完整的蓝牙功能测试建议使用真机。本项目在 H5/模拟器环境下使用 `MockBLEService` 进行 UI 和业务逻辑调试，真实 BLE 通信需在真机上验证。

### 2.3 通过命令行启动模拟器

```bash
# 列出可用的 AVD
emulator -list-avds

# 启动指定 AVD
emulator -avd <AVD名称>

# 启动并启用 GPU 加速（推荐）
emulator -avd <AVD名称> -gpu host
```

## 3. 生成 App 资源

项目已在 `package.json` 中配置了 App 端开发命令：

```bash
npm run dev:app
```

该命令执行 `uni -p app`，将项目编译为 App 端资源，输出到 `dist/dev/app` 目录。

## 4. HBuilderX 连接 Android 模拟器

### 4.1 安装 HBuilderX

1. 访问 [HBuilderX 官网](https://www.dcloud.io/hbuilderx.html) 下载 Windows 版本（推荐正式版）
2. 解压到任意目录（路径中避免中文和空格）
3. 启动 HBuilderX，首次使用需登录 DCloud 账号

### 4.2 连接模拟器

1. 先启动 Android 模拟器（通过 Android Studio Device Manager 或命令行）
2. 确认 `adb` 能识别模拟器：

```bash
adb devices
```

预期输出：

```
List of devices attached
emulator-5554   device
```

3. 在 HBuilderX 中打开项目
4. 点击菜单 **运行** → **运行到手机或模拟器** → **运行到 Android App 基座**
5. 在设备列表中选择模拟器（如 `emulator-5554`）
6. 首次运行会自动安装调试基座，等待安装完成后应用将自动启动

### 4.3 常见连接问题

| 问题 | 解决方案 |
|------|----------|
| 设备列表为空 | 确认模拟器已启动，执行 `adb devices` 检查连接状态 |
| adb 端口冲突 | 执行 `adb kill-server && adb start-server` 重启 adb 服务 |
| 基座安装失败 | 检查模拟器存储空间，或尝试手动安装基座 APK |
| 应用闪退 | 检查 `manifest.json` 中的最低 SDK 版本配置 |

## 5. 查看日志和调试信息

### 5.1 HBuilderX 控制台日志

运行 App 后，HBuilderX 底部会自动打开控制台面板，显示实时日志：

- **console.log / console.info** — 普通日志（白色）
- **console.warn** — 警告信息（黄色）
- **console.error** — 错误信息（红色）

在代码中使用 `console.log()` 即可在控制台查看输出：

```typescript
console.log('[BLE]', '扫描开始')
console.log('[Alarm]', '报警模式:', alarmMode)
```

### 5.2 过滤和搜索日志

- 控制台顶部提供搜索框，可按关键词过滤日志
- 使用统一的日志前缀（如 `[BLE]`、`[Alarm]`、`[GPS]`）便于分类查看

### 5.3 使用 Android Logcat

如需查看更底层的系统日志，可使用 `adb logcat`：

```bash
# 查看所有日志
adb logcat

# 过滤 uni-app 相关日志
adb logcat | grep -i "uni"

# 仅查看错误级别日志
adb logcat *:E
```

### 5.4 Chrome DevTools 远程调试

对于 WebView 内容的调试：

1. 在模拟器中打开应用
2. 在 PC 端 Chrome 浏览器访问 `chrome://inspect`
3. 在 **Remote Target** 中找到应用的 WebView
4. 点击 **inspect** 打开 DevTools，可查看 DOM、网络请求、Console 等

> **提示**：远程调试需要模拟器中的 WebView 版本支持，建议使用较新的系统镜像。
