import { fileURLToPath, URL } from "node:url"

import { mergeConfig, defineConfig, loadEnv } from "vite"
import regionIfdef from "vite-plugin-region-ifdef"

import { sharedConfig } from "@app/core/vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // Tauri 移动端开发时注入的局域网地址
  const tauriDevHost = process.env.TAURI_DEV_HOST
  return mergeConfig(sharedConfig, {
    plugins: [
      // 条件编译：本应用固定为 android 平台
      regionIfdef({ android: true, web: false, windows: false }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@app/core": fileURLToPath(new URL("../app_core/src", import.meta.url)),
        "@components": fileURLToPath(new URL("../app_core/src/components", import.meta.url)),
        "@shadcn/ui": fileURLToPath(new URL("../app_core/src/components/ui", import.meta.url)),
      },
    },
    server: {
      port: 5172,
      host: tauriDevHost || "0.0.0.0",
      hmr: tauriDevHost ? { protocol: "ws", host: tauriDevHost, port: 5173 } : undefined,
      proxy: { [env.VITE_APP_BASE_API]: { target: `http://${tauriDevHost || "localhost"}:1999`, changeOrigin: true } },
    },
    //下面的esbuild和build用于压缩打包后的代码,注释掉可以在线上看报错
    esbuild: {
      // 只保留报错日志 console.error
      pure: mode === "production" ? ["console.log", "console.debug", "console.info", "console.warn"] : [],
      drop: mode === "production" ? ["debugger"] : [],
    },
    build: { outDir: "dist", minify: "esbuild" },
  })
})
