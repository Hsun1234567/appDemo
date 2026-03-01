import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const isProduction = process.env.NODE_ENV === "production";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],

  // 环境变量注入
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  // H5 开发服务器配置
  server: {
    port: 5173,
    host: "0.0.0.0",
    // 代理规则（预留，当前无后端 API）
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    // HMR 热更新配置
    hmr: {
      overlay: true,
    },
  },

  build: {
    // 开发环境保留 sourcemap，生产环境关闭
    sourcemap: !isProduction,
    // 静态资源输出目录（uni-app 默认输出到 dist/build/h5）
    // 代码分割与压缩配置
    rollupOptions: {
      output: {
        // 代码分割：将第三方依赖拆分为独立 chunk
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("vue") || id.includes("pinia")) {
              return "vendor-vue";
            }
            if (id.includes("vue-i18n")) {
              return "vendor-i18n";
            }
            return "vendor";
          }
        },
        // 资源文件命名（含 hash 便于缓存）
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
      },
    },
    // 生产环境压缩配置
    minify: isProduction ? "terser" : false,
    terserOptions: isProduction
      ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        }
      : undefined,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
  },
});
