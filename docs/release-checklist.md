# 发布检查清单

本文档定义了智能安全报警器应用的发布流程，确保每次发布的质量和一致性。

## 1. 发布前检查

### 1.1 代码审查

- [ ] 所有功能分支已合并到主分支
- [ ] 代码审查（Code Review）已通过
- [ ] 无未解决的 TODO 或 FIXME 标记（或已记录到 Issue）

### 1.2 版本号更新

- [ ] 更新 `src/manifest.json` 中的 `versionName`（语义化版本，如 `1.2.0`）
- [ ] 更新 `src/manifest.json` 中的 `versionCode`（递增整数，如 `120`）
- [ ] 更新 `package.json` 中的 `version` 字段（与 `versionName` 保持一致）

> **版本号规则：**
> - `versionName`：遵循语义化版本（SemVer），格式为 `主版本.次版本.修订版本`
> - `versionCode`：整数，每次发布递增。建议规则：`主版本 * 100 + 次版本 * 10 + 修订版本`

### 1.3 测试验证

- [ ] 运行全部单元测试：`npm run test`
- [ ] 运行类型检查：`npm run type-check`
- [ ] 所有测试通过，无失败用例

### 1.4 环境配置确认

- [ ] 确认 `.env.production` 中的配置正确（API 地址、日志级别、调试开关已关闭）
- [ ] 确认 `VITE_ENABLE_DEBUG=false`（生产环境）
- [ ] 确认 `VITE_ENABLE_MOCK_BLE=false`（生产环境）

## 2. 构建步骤

### 2.1 H5 端构建

```bash
# 生产环境构建
npm run build:h5:prod

# 构建产物位于 dist/build/h5/
```

- [ ] 构建成功，无错误或警告
- [ ] 检查构建产物大小是否合理

### 2.2 Android App 构建

```bash
# 生产环境构建 App 资源
npm run build:app:prod
```

- [ ] 使用 HBuilderX 进行云打包或本地打包生成 APK
- [ ] 确认签名证书配置正确（参考 `docs/build-android.md`）
- [ ] APK 文件可正常安装

### 2.3 iOS App 构建

- [ ] 使用 HBuilderX 进行云打包或 Xcode 本地打包生成 IPA
- [ ] 确认证书和描述文件有效（参考 `docs/build-ios.md`）
- [ ] IPA 文件可正常安装到测试设备

## 3. 部署步骤

### 3.1 H5 端部署

- [ ] 将 `dist/build/h5/` 目录上传到 Web 服务器
- [ ] 确认 Nginx 配置正确（参考 `docs/deploy-h5.md`）
- [ ] 验证 HTTPS 证书有效
- [ ] 验证 SPA 路由重写正常工作

### 3.2 Android 发布

- [ ] 上传 APK 到应用分发平台
- [ ] 填写版本更新说明

### 3.3 iOS 发布

- [ ] 上传 IPA 到 App Store Connect
- [ ] 填写版本更新说明
- [ ] 提交审核

## 4. 发布后验证

- [ ] H5 端：访问生产 URL，验证页面正常加载
- [ ] H5 端：验证硬件功能入口已正确隐藏
- [ ] App 端：安装新版本，验证蓝牙扫描和连接功能
- [ ] App 端：验证报警流程端到端正常工作
- [ ] 确认版本号显示正确
- [ ] 确认日志级别为 `warn`（生产环境）

## 5. 回滚方案

如果发布后发现严重问题，按以下步骤回滚：

### 5.1 H5 端回滚

1. 将上一版本的构建产物重新部署到 Web 服务器
2. 清除 CDN 缓存（如有）
3. 验证回滚后页面正常

### 5.2 App 端回滚

1. 在应用分发平台下架当前版本
2. 重新上传上一版本的安装包
3. 通知用户更新

### 5.3 回滚后处理

- [ ] 记录问题原因和影响范围
- [ ] 创建修复 Issue 并安排修复计划
- [ ] 修复完成后重新走发布流程
