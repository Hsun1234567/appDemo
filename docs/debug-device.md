# App 端真机调试指南

本文档涵盖 Android 和 iOS 真机调试配置，以及 HBuilderX 自定义调试基座的使用。

---

## 一、Android 真机调试

### 1.1 开启开发者模式

1. 打开手机 **设置** → **关于手机**
2. 连续点击 **版本号** 7 次，直到提示"您已进入开发者模式"
3. 返回 **设置** → **系统** → **开发者选项**（部分机型在 **设置** → **更多设置** 中）

### 1.2 开启 USB 调试

在 **开发者选项** 中：

1. 开启 **USB 调试**
2. 开启 **USB 安装**（允许通过 USB 安装应用）
3. 部分机型需额外开启 **允许模拟位置信息**（用于 GPS 调试）

> 小米/MIUI 用户：还需开启 **USB 调试（安全设置）**，否则无法通过 USB 安装应用。

### 1.3 配置 adb 连接

确保 Android SDK Platform-Tools 已安装并加入系统 PATH（参考 `docs/debug-emulator.md` 第 1.3 节）。

用 USB 数据线连接手机和电脑：

```bash
# 检查设备是否被识别
adb devices
```

预期输出：

```
List of devices attached
XXXXXXXX    device
```

常见问题：

| 问题 | 解决方案 |
|------|----------|
| 设备显示 `unauthorized` | 手机上点击"允许 USB 调试"弹窗，勾选"始终允许" |
| 设备未显示 | 更换 USB 线（优先使用原装线）；安装手机品牌的 USB 驱动 |
| 显示 `offline` | 执行 `adb kill-server && adb start-server`，重新插拔 USB |
| MIUI 安装失败 | 开启 **USB 调试（安全设置）**，登录小米账号 |

### 1.4 安装调试基座

HBuilderX 提供两种调试基座：

- **标准基座**：内置常用插件，首次运行时自动安装
- **自定义基座**：包含项目所需的原生插件（SQLite、蓝牙等），需手动制作

首次调试可先使用标准基座验证连接：

1. HBuilderX 中打开项目
2. **运行** → **运行到手机或模拟器** → **运行到 Android App 基座**
3. 选择已连接的设备，等待基座安装和应用启动

---

## 二、HBuilderX 自定义调试基座

本项目使用了 SQLite 和蓝牙原生模块，需要制作自定义基座才能在真机上完整调试。

### 2.1 配置原生插件

项目 `src/manifest.json` 已声明所需模块：

```json
{
  "app-plus": {
    "modules": {
      "Bluetooth": {},
      "SQLite": {}
    }
  }
}
```

如需添加其他原生插件，在 HBuilderX 中：

1. 打开 `manifest.json` → **App 模块配置**
2. 勾选所需模块（Bluetooth、SQLite 等）
3. 保存

### 2.2 制作自定义基座

1. HBuilderX 菜单 → **运行** → **运行到手机或模拟器** → **制作自定义调试基座**
2. 选择 **Android** 平台
3. 选择打包方式：
   - **云打包**（推荐）：无需本地 Android 开发环境，DCloud 云端编译
   - **本地打包**：需配置 Android Studio 和 SDK
4. 等待打包完成，生成的基座 APK 位于 `unpackage/debug/` 目录

### 2.3 使用自定义基座运行

1. **运行** → **运行到手机或模拟器** → **运行到 Android App 基座**
2. 在弹出的对话框中选择 **使用自定义基座**
3. 选择设备，等待安装启动

> 每次修改 `manifest.json` 中的原生模块配置后，需重新制作自定义基座。

---

## 三、iOS 真机调试（需 Mac 环境）

### 3.1 环境准备

- macOS 系统（Monterey 12.0+）
- Xcode 14+（从 Mac App Store 安装）
- Apple 开发者账号（免费账号可用于调试，发布需付费账号）
- iOS 设备通过 USB 连接 Mac

### 3.2 Xcode 配置

1. 启动 Xcode → **Preferences** → **Accounts**
2. 点击 **+** 添加 Apple ID
3. 选择账号，点击 **Manage Certificates**
4. 点击 **+** → **Apple Development** 创建开发证书

### 3.3 证书签名配置

**使用免费账号调试**：

1. HBuilderX 中打开 `manifest.json` → **App 常用其它设置**
2. 填写 **Bundle ID**（格式：`com.yourname.safetyalarm`，需唯一）
3. 制作 iOS 自定义基座时选择 **使用 Apple 证书签名**
4. 选择对应的开发证书和设备

**使用付费开发者账号**：

1. 登录 [Apple Developer](https://developer.apple.com)
2. 在 **Certificates, Identifiers & Profiles** 中：
   - 创建 App ID（Bundle ID 与 manifest.json 一致）
   - 创建 Development Certificate
   - 注册调试设备的 UDID
   - 创建 Development Provisioning Profile
3. 下载 Profile 文件，双击安装到 Xcode

### 3.4 设备信任

首次在 iOS 设备上安装调试应用后：

1. 设备上打开 **设置** → **通用** → **VPN 与设备管理**
2. 找到开发者证书对应的条目
3. 点击 **信任**

### 3.5 通过 HBuilderX 运行

1. iOS 设备通过 USB 连接 Mac
2. HBuilderX → **运行** → **运行到手机或模拟器** → **运行到 iOS App 基座**
3. 首次运行需制作 iOS 自定义基座（流程同 Android，选择 iOS 平台）
4. 选择设备，等待安装启动

> 免费账号签名的应用有效期 7 天，过期后需重新安装。

---

## 四、调试工具函数

项目提供了 `src/utils/debug.ts` 调试工具模块，包含以下功能：

| 函数 | 说明 |
|------|------|
| `printEnvInfo()` | 打印平台、系统信息、应用版本 |
| `checkBLEStatus()` | 检查蓝牙适配器是否可用 |
| `inspectStorage(key?)` | 读取并打印本地存储数据 |
| `logEvent(tag, message)` | 结构化调试日志输出 |

在页面或控制台中调用：

```typescript
import { printEnvInfo, checkBLEStatus, inspectStorage } from '@/utils/debug'

// 打印环境信息
await printEnvInfo()

// 检查蓝牙状态
const bleOk = await checkBLEStatus()

// 查看所有关键存储数据
await inspectStorage()

// 查看指定 key
await inspectStorage('emergency_contacts')
```

---

## 五、调试技巧

- 使用 `logEvent('BLE', '扫描开始')` 统一日志格式，便于在 HBuilderX 控制台过滤
- 真机调试蓝牙时，确保手机蓝牙已开启且报警器设备在附近
- 如遇权限问题，检查 `manifest.json` 中的权限声明是否完整
- Android 12+ 需要运行时申请 `BLUETOOTH_SCAN` 和 `BLUETOOTH_CONNECT` 权限
- iOS 首次使用蓝牙/定位会弹出系统授权弹窗，需用户允许
