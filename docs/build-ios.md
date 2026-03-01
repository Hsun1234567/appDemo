# iOS IPA 打包发布指南

本文档介绍智能安全报警器 iOS 端的打包发布流程，包括证书配置、HBuilderX 云打包和 Xcode 本地打包两种方式。

## 目录

- [前置条件](#前置条件)
- [Apple 开发者证书配置](#apple-开发者证书配置)
- [Provisioning Profile 描述文件](#provisioning-profile-描述文件)
- [manifest.json iOS 配置说明](#manifestjson-ios-配置说明)
- [HBuilderX 云打包](#hbuilderx-云打包)
- [Xcode 本地打包](#xcode-本地打包)
- [App Store 提交指南](#app-store-提交指南)
- [常见问题](#常见问题)

---

## 前置条件

### 硬件与系统要求

| 要求 | 说明 |
|------|------|
| **Mac 电脑** | macOS 13 (Ventura) 或更高版本 |
| **Xcode** | 15.0 或更高版本（通过 Mac App Store 安装） |
| **Apple Developer 账号** | 个人开发者（$99/年）或企业开发者（$299/年） |
| **iOS 设备**（可选） | 用于真机调试，iOS 15.0+ |

### 软件环境

- **Node.js**: >= 18.x（参考 `.nvmrc`）
- **HBuilderX**: >= 4.0（推荐最新稳定版）
- **CocoaPods**: 用于管理 iOS 原生依赖

安装 CocoaPods：

```bash
sudo gem install cocoapods
pod setup
```

### 项目配置检查

确认 `src/manifest.json` 中以下 iOS 配置项已正确设置：

| 配置项 | 说明 | 当前值 |
|--------|------|--------|
| `name` | 应用名称 | `智能安全报警器` |
| `appid` | uni-app 应用 ID | `__UNI__SAFETY_ALARM` |
| `versionName` | 版本名称 | `1.0.0` |
| `versionCode` | 版本号（整数，每次发布递增） | `100` |
| `bundleId` | iOS Bundle Identifier | `com.safetyalarm.app` |

---

## Apple 开发者证书配置

iOS 应用打包需要 Apple 签名证书。证书分为开发证书和发布证书两种类型。

### 证书类型说明

| 证书类型 | 用途 | 有效期 |
|----------|------|--------|
| **iOS Development** | 开发调试，安装到测试设备 | 1 年 |
| **iOS Distribution** | 发布到 App Store 或企业分发 | 1 年 |

### 创建开发证书（Development Certificate）

1. **生成证书签名请求（CSR）**：
   - 打开 Mac 上的 **钥匙串访问**（Keychain Access）
   - 菜单栏选择 `钥匙串访问 → 证书助理 → 从证书颁发机构请求证书...`
   - 填写邮箱地址和常用名称
   - 选择 **存储到磁盘**，点击继续
   - 保存生成的 `CertificateSigningRequest.certSigningRequest` 文件

2. **在 Apple Developer 网站创建证书**：
   - 登录 [Apple Developer](https://developer.apple.com/account)
   - 进入 `Certificates, Identifiers & Profiles → Certificates`
   - 点击 `+` 按钮，选择 **iOS App Development**
   - 上传步骤 1 生成的 CSR 文件
   - 下载生成的 `.cer` 证书文件

3. **安装证书**：
   - 双击下载的 `.cer` 文件，自动导入到钥匙串
   - 在钥匙串访问中确认证书已安装且状态为"此证书有效"

### 创建发布证书（Distribution Certificate）

步骤与开发证书类似，区别在于：

1. 在 Apple Developer 网站创建证书时，选择 **iOS Distribution (App Store and Ad Hoc)**
2. 每个开发者账号最多可创建 **3 个**发布证书

### 导出 .p12 证书文件

HBuilderX 云打包需要 `.p12` 格式的证书文件：

1. 打开 **钥匙串访问**
2. 在 **我的证书** 分类中找到刚安装的证书
3. 右键点击证书 → **导出...**
4. 选择格式为 **个人信息交换 (.p12)**
5. 设置导出密码（打包时需要输入此密码）
6. 保存 `.p12` 文件

> **重要**：妥善保管 `.p12` 文件和导出密码，不要提交到版本控制。

---

## Provisioning Profile 描述文件

Provisioning Profile（描述文件）将证书、App ID 和设备绑定在一起，是 iOS 打包的必要文件。

### 创建 App ID

1. 登录 [Apple Developer](https://developer.apple.com/account)
2. 进入 `Certificates, Identifiers & Profiles → Identifiers`
3. 点击 `+` 按钮，选择 **App IDs → App**
4. 填写描述信息和 Bundle ID：`com.safetyalarm.app`
5. 在 Capabilities 中勾选以下能力：
   - **Background Modes**（后台模式）
   - **Push Notifications**（推送通知，可选）
6. 点击 **Continue → Register**

### 注册测试设备（开发阶段）

1. 进入 `Certificates, Identifiers & Profiles → Devices`
2. 点击 `+` 按钮
3. 填写设备名称和 UDID
4. 获取设备 UDID 的方法：
   - 将 iOS 设备连接到 Mac
   - 打开 Xcode → Window → Devices and Simulators
   - 选择设备，复制 Identifier（即 UDID）

### 创建开发描述文件（Development Profile）

1. 进入 `Certificates, Identifiers & Profiles → Profiles`
2. 点击 `+` 按钮，选择 **iOS App Development**
3. 选择 App ID：`com.safetyalarm.app`
4. 选择开发证书
5. 选择测试设备
6. 填写描述文件名称（如 `SafetyAlarm_Dev`）
7. 下载生成的 `.mobileprovision` 文件

### 创建发布描述文件（Distribution Profile）

1. 进入 `Certificates, Identifiers & Profiles → Profiles`
2. 点击 `+` 按钮，选择 **App Store Connect**
3. 选择 App ID：`com.safetyalarm.app`
4. 选择发布证书
5. 填写描述文件名称（如 `SafetyAlarm_AppStore`）
6. 下载生成的 `.mobileprovision` 文件

### 描述文件类型对照

| 类型 | 用途 | 需要设备 UDID |
|------|------|---------------|
| **iOS App Development** | 开发调试 | 是 |
| **Ad Hoc** | 内部测试分发（限 100 台设备） | 是 |
| **App Store Connect** | 提交到 App Store | 否 |
| **In-House**（企业账号） | 企业内部分发 | 否 |

---

## manifest.json iOS 配置说明

`src/manifest.json` 中与 iOS 相关的配置项说明：

### 基础信息

```json
{
  "name": "智能安全报警器",
  "appid": "__UNI__SAFETY_ALARM",
  "versionName": "1.0.0",
  "versionCode": "100"
}
```

- `name`：应用在设备上显示的名称
- `appid`：uni-app 应用标识，正式发布前需在 DCloud 开发者中心申请
- `versionName`：用户可见的版本号（如 1.0.0）
- `versionCode`：内部版本号，每次提交 App Store 必须递增

### iOS 打包配置

```json
{
  "app-plus": {
    "distribute": {
      "ios": {
        "bundleId": "com.safetyalarm.app",
        "dSYMs": false,
        "privacyDescription": {
          "NSBluetoothAlwaysUsageDescription": "...",
          "NSBluetoothPeripheralUsageDescription": "...",
          "NSLocationWhenInUseUsageDescription": "...",
          "NSLocationAlwaysUsageDescription": "...",
          "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
          "NSUserNotificationsUsageDescription": "..."
        },
        "UIBackgroundModes": ["bluetooth-central", "location"]
      }
    }
  }
}
```

### iOS 权限用途说明

Apple 要求所有使用隐私敏感 API 的应用必须在 `Info.plist` 中提供用途说明。以下是本应用声明的权限：

| 权限键 | 用途说明 | 必要性 |
|--------|----------|--------|
| `NSBluetoothAlwaysUsageDescription` | 蓝牙连接报警器设备，接收报警信号 | 必需 |
| `NSBluetoothPeripheralUsageDescription` | 蓝牙外设连接（iOS 12 及以下） | 必需 |
| `NSLocationWhenInUseUsageDescription` | 报警时获取位置发送给紧急联系人 | 必需 |
| `NSLocationAlwaysUsageDescription` | 后台获取位置用于报警触发 | 必需 |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | 持续获取位置用于报警 | 必需 |
| `NSUserNotificationsUsageDescription` | 报警触发、设备断连等通知提醒 | 必需 |

> **App Store 审核提示**：权限用途说明必须清晰描述为什么需要该权限，模糊的描述会导致审核被拒。

### iOS 后台模式

```json
"UIBackgroundModes": ["bluetooth-central", "location"]
```

- `bluetooth-central`：允许应用在后台维持 BLE 连接，接收报警器信号
- `location`：允许应用在后台获取位置信息，用于报警时发送 GPS 位置

### iOS 图标配置

图标文件需要准备以下尺寸（放置在 `src/static/icons/ios/` 目录）：

| 尺寸 | 用途 |
|------|------|
| 1024x1024 | App Store 展示图标 |
| 180x180 | iPhone App 图标 @3x |
| 167x167 | iPad Pro App 图标 @2x |
| 152x152 | iPad App 图标 @2x |
| 120x120 | iPhone App 图标 @2x / Spotlight @3x |
| 87x87 | iPhone 设置图标 @3x |
| 80x80 | Spotlight 图标 @2x |
| 76x76 | iPad App 图标 |
| 60x60 | iPhone 通知图标 @3x |
| 58x58 | 设置图标 @2x |
| 40x40 | Spotlight / 通知图标 @2x |
| 29x29 | 设置图标 |
| 20x20 | 通知图标 |

> **提示**：建议先制作 1024x1024 的高清图标，再使用工具（如 [App Icon Generator](https://www.appicon.co/)）批量生成各尺寸。

---

## HBuilderX 云打包

HBuilderX 云打包是最便捷的 iOS 打包方式，无需本地配置 Xcode 环境（但仍需 Apple 开发者账号和证书）。

### 打包步骤

1. **生成 App 资源**：

   ```bash
   npm run build:app
   ```

2. **打开 HBuilderX 云打包界面**：
   - 在 HBuilderX 中打开项目
   - 选择菜单 `发行 → 原生App-云打包`

3. **配置 iOS 打包参数**：
   - 选择 **iOS** 平台
   - 填写 Bundle ID：`com.safetyalarm.app`
   - 上传 `.p12` 证书文件
   - 输入证书密码
   - 上传 `.mobileprovision` 描述文件
   - 选择打包类型：
     - **开发测试**：使用开发证书 + 开发描述文件
     - **正式发布**：使用发布证书 + 发布描述文件

4. **提交打包**：点击"打包"按钮，等待云端构建完成

5. **下载 IPA**：构建完成后，从 HBuilderX 控制台下载 IPA 文件

### 云打包注意事项

- 云打包需要 DCloud 开发者账号
- 免费账号每天有打包次数限制（通常 5 次）
- iOS 云打包时间通常为 10-20 分钟
- 确保 `.p12` 证书和 `.mobileprovision` 描述文件匹配（同一个 App ID 和证书）

---

## Xcode 本地打包

本地打包适合需要自定义原生代码、调试原生插件或频繁打包的场景。

### 前置准备

1. 确保已安装 Xcode 15.0+
2. 确保已安装 CocoaPods
3. 确保已配置好开发/发布证书和描述文件

### 打包步骤

1. **生成 App 资源**：

   ```bash
   npm run build:app
   ```

   构建产物输出到 `dist/build/app` 目录。

2. **下载 uni-app iOS 离线 SDK**：
   - 访问 [DCloud 官方文档](https://nativesupport.dcloud.net.cn/AppDocs/download/ios.html)
   - 下载与 HBuilderX 版本匹配的 iOS 离线 SDK

3. **导入 Xcode 工程**：
   - 解压离线 SDK，用 Xcode 打开其中的 `HBuilder-uniPluginDemo.xcodeproj`（或 `.xcworkspace`）
   - 将步骤 1 生成的 App 资源复制到工程的 `apps/__UNI__SAFETY_ALARM/www/` 目录

4. **配置 Xcode 工程**：

   - **General 选项卡**：
     - Display Name：`智能安全报警器`
     - Bundle Identifier：`com.safetyalarm.app`
     - Version：`1.0.0`
     - Build：`100`
     - Deployment Target：`iOS 13.0`

   - **Signing & Capabilities 选项卡**：
     - 勾选 **Automatically manage signing**（推荐）
     - 选择 Team（你的 Apple Developer 团队）
     - 或手动选择证书和描述文件

   - **添加 Capabilities**：
     - 点击 `+ Capability`
     - 添加 **Background Modes**，勾选：
       - `Uses Bluetooth LE accessories`
       - `Location updates`
     - 添加 **Push Notifications**（如需推送通知）

5. **配置 Info.plist 权限**：

   确认以下权限已在 `Info.plist` 中声明（通常 uni-app SDK 已自动配置）：

   ```xml
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>该应用需要使用蓝牙连接安全报警器设备，以接收报警信号并管理设备状态。</string>
   <key>NSBluetoothPeripheralUsageDescription</key>
   <string>该应用需要使用蓝牙连接安全报警器设备。</string>
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>该应用需要获取您的位置信息，以便在报警时将位置发送给紧急联系人。</string>
   <key>NSLocationAlwaysUsageDescription</key>
   <string>该应用需要在后台获取您的位置信息，以便在报警触发时自动发送位置给紧急联系人。</string>
   <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
   <string>该应用需要持续获取您的位置信息，以便在报警时将准确位置发送给紧急联系人。</string>
   <key>NSUserNotificationsUsageDescription</key>
   <string>该应用需要发送通知，以便在报警触发、设备断连、计时器到期等情况下及时提醒您。</string>
   ```

6. **构建 Archive**：
   - 选择目标设备为 **Any iOS Device (arm64)**
   - 菜单选择 `Product → Archive`
   - 等待 Archive 构建完成

7. **导出 IPA**：
   - Archive 完成后自动打开 **Organizer** 窗口
   - 选择刚构建的 Archive，点击 **Distribute App**
   - 选择分发方式：
     - **App Store Connect**：提交到 App Store
     - **Ad Hoc**：生成 IPA 用于内部测试
     - **Development**：生成开发版 IPA
   - 按提示选择证书和描述文件
   - 导出 IPA 文件

### 安装测试 IPA

开发或 Ad Hoc 版本的 IPA 可通过以下方式安装到测试设备：

```bash
# 使用 Xcode 命令行工具
xcrun devicectl device install app --device <设备UDID> <IPA路径>

# 或通过 Xcode → Window → Devices and Simulators 拖拽安装
```

也可使用第三方工具如 [蒲公英](https://www.pgyer.com/) 或 [fir.im](https://www.betaqr.com/) 进行内测分发。

---

## App Store 提交指南

### 准备工作

1. **创建 App Store Connect 应用**：
   - 登录 [App Store Connect](https://appstoreconnect.apple.com)
   - 进入 `我的 App → +` 创建新应用
   - 填写应用名称、Bundle ID、SKU 等信息

2. **准备应用截图**：

   | 设备类型 | 截图尺寸 | 数量要求 |
   |----------|----------|----------|
   | iPhone 6.7" | 1290 x 2796 | 至少 1 张，最多 10 张 |
   | iPhone 6.5" | 1284 x 2778 | 至少 1 张，最多 10 张 |
   | iPhone 5.5" | 1242 x 2208 | 至少 1 张，最多 10 张 |
   | iPad 12.9" | 2048 x 2732 | 至少 1 张（如支持 iPad） |

3. **准备应用描述**：
   - 应用名称（30 字符以内）
   - 副标题（30 字符以内）
   - 关键词（100 字符以内，逗号分隔）
   - 应用描述（4000 字符以内）
   - 隐私政策 URL
   - 技术支持 URL

### 上传构建版本

使用 Xcode 上传：

1. 在 Xcode 中完成 Archive（参考本地打包步骤 6）
2. 在 Organizer 中选择 **Distribute App → App Store Connect → Upload**
3. 等待上传和处理完成（通常 15-30 分钟）

使用 Transporter 上传：

1. 从 Mac App Store 安装 **Transporter**
2. 将导出的 IPA 拖入 Transporter
3. 点击 **交付** 上传

### 提交审核

1. 在 App Store Connect 中选择已上传的构建版本
2. 填写审核信息：
   - 联系信息（审核团队联系方式）
   - 登录凭据（如应用需要登录，提供测试账号）
   - 备注（说明蓝牙功能需要实体设备测试等特殊情况）
3. 点击 **提交以供审核**

### App Store 审核注意事项

- **蓝牙权限**：审核团队可能要求提供蓝牙功能的演示视频，建议在备注中附上
- **后台模式**：使用 `bluetooth-central` 和 `location` 后台模式需要在审核备注中说明具体用途
- **隐私政策**：必须提供有效的隐私政策链接，说明数据收集和使用方式
- **权限说明**：所有权限用途描述必须清晰具体，不能使用模糊表述
- **审核周期**：通常 1-3 个工作日，首次提交可能需要更长时间

---

## 常见问题

### 1. 证书过期或无效

**现象**：打包时提示 `Code signing error` 或 `No valid signing identity`

**解决**：
- 检查证书是否过期（有效期 1 年），过期需重新创建
- 确认证书已安装到 Mac 钥匙串中
- 确认 `.p12` 文件导出时包含了私钥
- 在钥匙串访问中检查证书状态是否为"此证书有效"

### 2. 描述文件不匹配

**现象**：`Provisioning profile does not match bundle identifier`

**解决**：
- 确认描述文件中的 App ID 与 `manifest.json` 中的 `bundleId` 一致
- 确认描述文件使用的证书与打包使用的证书一致
- 重新下载最新的描述文件

### 3. 设备未注册

**现象**：开发版 IPA 无法安装到测试设备

**解决**：
- 在 Apple Developer 网站注册设备 UDID
- 将设备添加到开发描述文件中
- 重新生成并下载描述文件

### 4. 后台蓝牙被系统终止

**现象**：应用进入后台后蓝牙连接断开

**解决**：
- 确认 `UIBackgroundModes` 中包含 `bluetooth-central`
- 确认 Xcode 工程的 Capabilities 中已启用 Background Modes
- iOS 系统在内存紧张时仍可能终止后台应用，这是系统行为

### 5. App Store 审核被拒：权限说明不充分

**现象**：审核反馈 `This app has crashed on launch` 或权限相关拒绝

**解决**：
- 确保所有 `NSxxxUsageDescription` 描述清晰说明了为什么需要该权限
- 描述应包含具体的使用场景，避免泛泛而谈
- 示例：不要写"需要蓝牙权限"，应写"需要使用蓝牙连接安全报警器设备，以接收报警信号"

### 6. 云打包失败：证书格式错误

**现象**：HBuilderX 云打包提示证书格式不正确

**解决**：
- 确认上传的是 `.p12` 格式（不是 `.cer`）
- 确认 `.p12` 文件包含私钥（导出时需要从"我的证书"分类导出）
- 确认证书密码输入正确
- 尝试重新从钥匙串导出 `.p12` 文件

### 7. 构建命令参考

```bash
# 生成 App 资源（用于云打包或本地打包）
npm run build:app

# 开发模式运行（连接模拟器或真机）
npm run dev:app
```

### 8. iOS 版本兼容性

本应用最低支持 iOS 13.0，主要考虑因素：

- BLE 后台模式在 iOS 13+ 上表现稳定
- Core Bluetooth API 在 iOS 13+ 上功能完整
- 覆盖约 99% 的活跃 iOS 设备
