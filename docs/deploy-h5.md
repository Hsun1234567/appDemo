# H5 端构建与部署指南

## 构建命令

```bash
# 安装依赖
npm install

# 开发环境构建
npm run dev:h5

# 生产环境构建（输出到 dist/build/h5）
npm run build:h5
```

构建产物位于 `dist/build/h5/` 目录，包含 `index.html` 及静态资源文件。

---

## 环境变量

项目通过 `.env.*` 文件区分不同环境：

| 文件 | 用途 |
|------|------|
| `.env.development` | 本地开发 |
| `.env.staging` | 测试环境 |
| `.env.production` | 生产环境 |

可用变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_APP_ENV` | 环境标识 | `production` |
| `VITE_API_BASE_URL` | API 地址 | `https://api.example.com` |
| `VITE_ENABLE_DEBUG` | 调试开关 | `false` |
| `VITE_LOG_LEVEL` | 日志级别 | `warn` |

使用测试环境构建：

```bash
npx uni build -p h5 --mode staging
```

---

## Nginx 部署配置

### 基础配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/safety-alarm/h5;
    index index.html;

    # SPA 路由重写 —— 所有路径回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存（带 hash 的文件长期缓存）
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html 不缓存，确保更新即时生效
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;
}
```

### HTTPS 配置（推荐）

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/safety-alarm/h5;
    index index.html;

    ssl_certificate     /etc/nginx/ssl/your-domain.crt;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

---

## Docker 部署

### Dockerfile

```dockerfile
FROM nginx:alpine

# 复制构建产物
COPY dist/build/h5 /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf（Docker 用）

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;
}
```

### 构建与运行

```bash
# 先构建 H5 产物
npm run build:h5

# 构建 Docker 镜像
docker build -t safety-alarm-h5 .

# 运行容器
docker run -d -p 8080:80 --name safety-alarm safety-alarm-h5
```

---

## CDN 配置

如需将静态资源托管到 CDN，修改 `vite.config.ts` 中的 `base` 选项：

```typescript
// vite.config.ts
export default defineConfig({
  // 设置为 CDN 地址
  // base: 'https://cdn.example.com/safety-alarm/',
});
```

CDN 缓存策略建议：

| 资源类型 | 缓存时间 | 说明 |
|----------|----------|------|
| `static/js/*.js` | 1 年 | 文件名含 hash，内容变更时 hash 变化 |
| `static/css/*.css` | 1 年 | 同上 |
| `index.html` | 不缓存 | 入口文件必须实时更新 |
| 图片/字体 | 1 年 | 静态资源长期缓存 |

---

## 常见问题

### 刷新页面 404

确保 Nginx 配置了 `try_files $uri $uri/ /index.html`，这是 SPA 路由的必要配置。

### 资源加载失败

检查 `vite.config.ts` 中的 `base` 路径是否与实际部署路径一致。如果部署在子路径下（如 `/app/`），需要设置 `base: '/app/'`。

### Gzip 未生效

确认 Nginx 的 `gzip_types` 包含了对应的 MIME 类型，并且 `gzip_min_length` 设置合理（建议 1024 字节以上才压缩）。
