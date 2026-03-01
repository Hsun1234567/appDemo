# Android APK 打包发布指南

本文档介绍智能安全报警器 Android 端的打包发布流程，包括 HBuilderX 云打包和本地打包两种方式。

## 目录

- [前置条件](#前置条件)
- [签名证书配置](#签名证书配置)
- [HBuilderX 云打包](#hbuilderx-云打包)
- [本地打包（Android Studio）](#本地打包android-studio)
- [ProGuard 混淆配置](#proguard-混淆配置)
- [APK 签名与验证](#apk-签名与验证)
- [常见问题](#常见问题)

---

## 前置条件

### 开发环境

- **Node.js**: >= 18.x（参考 `.nvmrc`）
- **HBuilderX**: >= 4.0（推荐最新稳定版）
- **Android SDK**: API Level 23+（targetSdkVersion 33）
- **JDK**: >= 11（用于签名证书生成和 Gradle 构建）

### Android SDK 配置

1. 安装 Android Studio 并通过 SDK Manager 安装以下组件：
   - Android SDK Platform 33
   - Android SDK Build-Tools 33.x
   - Android SDK Platform-Tools
   - Android Emulator（可选，用于模拟器测试）

2. 配置环境变量：

```bash
# Windows
set ANDROID_HOME=C:\Users\<用户名>\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools

# macOS / Linux
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

### 项目配置检查

确认 `src/manifest.json` 中以下 Android 配置项已正确设置：

| 配置项 | 说明 | 当前值 |
|--------|------|--------|
| `packagename` | 应用包名 | `com.safetyalarm.app` |
| `versionName` | 版本名称 | `1.0.0` |
| `versionCode` | 版本号（整数，每次发布递增） | `100` |
| `targetSdkVersion` | 目标 SDK 版本 | `33` |
| `minSdkVersion` | 最低支持 SDK 版本 | `23` |

---

## 签名证书配置

Android 应用发布必须使用签名证书。以下是生成和配置签名证书的步骤。

### 生成 Keystore 文件

使用 JDK 自带的 `keytool` 命令生成签名证书：

```bash
keytool -genkey -v \
  -keystore safety-alarm.keystore \
  -alias safety-alarm \
  -keyalg RSA \
  -keysize 2048 \
  -validity 36500 \
  -storepass <你的密码> \
  -keypass <你的密码> \
  -dname "CN=SafetyAlarm, OU=Dev, O=SafetyAlarm, L=Beijing, ST=Beijing, C=CN"
```

参数说明：

| 参数 | 说明 |
|------|------|
| `-keystore` | 输出的 keystore 文件名 |
| `-alias` | 密钥别名 |
| `-keyalg` | 密钥算法（RSA） |
| `-keysize` | 密钥长度（2048 位） |
| `-validity` | 有效期天数（36500 = 约 100 年） |
| `-storepass` | keystore 密码 |
| `-keypass` | 密钥密码 |


### 安全注意事项

> **重要**：keystore 文件和密码是应用签名的核心凭证，丢失后无法更新已发布的应用。

- 将 `*.keystore` 添加到 `.gitignore`，不要提交到版本控制
- 将密码保存在安全的密码管理器中
- 备份 keystore 文件到安全的离线存储

### 在 manifest.json 中配置签名

`src/manifest.json` 中已预配置签名相关字段：

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "keystore": "safety-alarm.keystore",
        "keystoreAlias": "safety-alarm",
        "keystorePassword": ""
      }
    }
  }
}
```

> 注意：`keystorePassword` 留空，在打包时通过 HBuilderX 界面或命令行参数传入，避免密码泄露。

---

## HBuilderX 云打包

HBuilderX 云打包是最简单的打包方式，无需本地配置 Android 开发环境。

### 步骤

1. **打开项目**：在 HBuilderX 中打开项目根目录

2. **生成 App 资源**：
   ```bash
   npm run build:app
   ```
   或在 HBuilderX 中选择 `发行 → 原生App-云打包`

3. **配置打包参数**：
   - 选择 Android 平台
   - 填写应用包名：`com.safetyalarm.app`
   - 选择签名证书：上传 `safety-alarm.keystore` 文件
   - 填写证书别名：`safety-alarm`
   - 填写证书密码
   - 选择 CPU 架构：`armeabi-v7a` + `arm64-v8a`

4. **选择打包类型**：
   - **正式包**：用于发布到应用商店
   - **自定义调试基座**：用于开发调试

5. **提交云打包**：点击"打包"按钮，等待云端构建完成

6. **下载 APK**：构建完成后，从 HBuilderX 控制台下载 APK 文件

### 云打包注意事项

- 云打包需要 DCloud 开发者账号
- 免费账号每天有打包次数限制
- 云打包队列可能需要排队等待
- 首次打包时间较长（约 5-10 分钟），后续打包会更快

---

## 本地打包（Android Studio）

本地打包适合需要自定义原生代码或频繁打包的场景。

### 前置准备

1. 安装 Android Studio（最新稳定版）
2. 安装 JDK 11+
3. 配置 Android SDK（API Level 23-33）

### 步骤

1. **生成 App 资源**：

   ```bash
   npm run build:app
   ```

   构建产物输出到 `dist/build/app` 目录。

2. **下载 uni-app 离线 SDK**：
   - 访问 [DCloud 官方文档](https://nativesupport.dcloud.net.cn/AppDocs/download/android.html)
   - 下载与 HBuilderX 版本匹配的 Android 离线 SDK

3. **导入 Android 工程**：
   - 解压离线 SDK，用 Android Studio 打开其中的 `HBuilder-Integrate-AS` 工程
   - 将步骤 1 生成的 App 资源复制到 `app/src/main/assets/apps/__UNI__SAFETY_ALARM/www/` 目录

4. **配置 `build.gradle`**：

   ```groovy
   android {
       defaultConfig {
           applicationId "com.safetyalarm.app"
           minSdkVersion 23
           targetSdkVersion 33
           versionCode 100
           versionName "1.0.0"
       }

       signingConfigs {
           release {
               storeFile file("../safety-alarm.keystore")
               storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
               keyAlias "safety-alarm"
               keyPassword System.getenv("KEY_PASSWORD") ?: ""
           }
       }

       buildTypes {
           release {
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
               signingConfig signingConfigs.release
           }
       }
   }
   ```

5. **构建 APK**：

   ```bash
   # 在 Android 工程目录下执行
   ./gradlew assembleRelease
   ```

   或在 Android Studio 中选择 `Build → Generate Signed Bundle / APK`。

6. **输出路径**：

   APK 文件位于 `app/build/outputs/apk/release/app-release.apk`

---

## ProGuard 混淆配置

ProGuard 用于代码混淆和优化，保护应用代码不被轻易反编译。

### 配置文件

在 Android 工程的 `app/proguard-rules.pro` 中添加以下规则：

```proguard
# ========================================
# 智能安全报警器 ProGuard 规则
# ========================================

# --- 基础配置 ---
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose

# --- uni-app 框架保护 ---
-keep class io.dcloud.** { *; }
-keep class uni.** { *; }
-keep class com.dcloud.** { *; }

# --- WebView 相关 ---
-keepclassmembers class * extends android.webkit.WebView {
    public *;
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public *;
}

# --- JavaScript 接口 ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- 蓝牙相关 ---
-keep class android.bluetooth.** { *; }
-keep class android.bluetooth.le.** { *; }

# --- SQLite 插件 ---
-keep class net.sqlcipher.** { *; }
-keep class net.sqlcipher.database.** { *; }

# --- JSON 序列化 ---
-keepclassmembers class * {
    public <init>();
}
-keepattributes Signature
-keepattributes *Annotation*

# --- 保留枚举 ---
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# --- 保留 Parcelable ---
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# --- 保留 Serializable ---
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# --- 移除日志（发布版本） ---
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
```

### 在 HBuilderX 云打包中启用混淆

HBuilderX 云打包默认已启用基础混淆。如需自定义规则：

1. 在项目根目录创建 `native-plugins/` 目录
2. 将自定义 `proguard-rules.pro` 放入该目录
3. 在 `manifest.json` 的 `app-plus.distribute.android` 中引用

---

## APK 签名与验证

### 验证 APK 签名

打包完成后，验证 APK 是否正确签名：

```bash
# 使用 apksigner 验证（推荐）
apksigner verify --verbose app-release.apk

# 使用 jarsigner 验证
jarsigner -verify -verbose -certs app-release.apk
```

### 查看签名信息

```bash
keytool -printcert -jarfile app-release.apk
```

### APK 对齐优化

发布前建议进行 zipalign 对齐优化：

```bash
zipalign -v 4 app-release-unsigned.apk app-release-aligned.apk
```

> 注意：如果使用 Android Studio 的 `Generate Signed APK` 功能，zipalign 会自动执行。

---

## 常见问题

### 1. 打包失败：证书密码错误

**现象**：打包时提示 `Keystore was tampered with, or password was incorrect`

**解决**：
- 确认 keystore 密码正确
- 确认 key alias 名称与生成时一致
- 重新生成 keystore 文件（注意：已发布的应用将无法更新）

### 2. 打包失败：SDK 版本不匹配

**现象**：`Failed to find target with hash string 'android-33'`

**解决**：
- 打开 Android Studio → SDK Manager
- 安装 Android SDK Platform 33
- 确认 `ANDROID_HOME` 环境变量指向正确的 SDK 路径

### 3. APK 安装失败：签名不一致

**现象**：设备上已安装旧版本，新版本安装提示签名冲突

**解决**：
- 卸载旧版本后重新安装
- 确保使用相同的 keystore 文件签名

### 4. 蓝牙权限问题（Android 12+）

**现象**：Android 12 及以上设备蓝牙功能不可用

**解决**：
- 确认 `manifest.json` 中已声明 `BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`、`BLUETOOTH_ADVERTISE` 权限
- 应用运行时需动态申请这些权限

### 5. 云打包排队时间过长

**解决**：
- 避开高峰时段（工作日上午 10-12 点）
- 升级 DCloud 开发者账号以获得更高优先级
- 考虑使用本地打包方式

### 6. APK 体积过大

**解决**：
- 在 `manifest.json` 中仅勾选需要的模块（Bluetooth、SQLite）
- 配置 `abiFilters` 仅包含 `armeabi-v7a` 和 `arm64-v8a`
- 启用 ProGuard 混淆和代码优化
- 压缩图片和音频等静态资源

### 7. 构建命令参考

```bash
# 生成 App 资源（用于云打包或本地打包）
npm run build:app

# 开发模式运行（连接模拟器或真机）
npm run dev:app
```
