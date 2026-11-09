import { fileURLToPath, URL } from "node:url"

import { mergeConfig, defineConfig } from "vite"

import compression from "vite-plugin-compression"
import Font from "vite-plugin-font"
import regionIfdef from "vite-plugin-region-ifdef"

import { sharedConfig } from "@app/core/vite"

interface AssetInfo {
  name: string
  type: "asset" | "chunk"
}

export default defineConfig(({ mode }) =>
  mergeConfig(sharedConfig, {
    plugins: [
      // 条件编译：本应用固定为 web 平台
      regionIfdef({ android: false, web: true, windows: false }),
      Font.vite(),
      //压缩成gzip，减少传输的资源大小，提高网站资源加载速度
      compression({
        filter: /.(js|mjs|json|css|html)$/i,
        algorithm: "gzip",
        ext: ".gz", // 输出文件的扩展名
        threshold: 10240, // 只压缩大于 1KB 的文件
        deleteOriginFile: false, // 是否删除源文件
      }),
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
      host: "0.0.0.0",
      open: true,
    },
    base: "/",
    //下面的esbuild和build用于压缩打包后的代码,注释掉可以在线上看报错
    esbuild: {
      // 只保留报错日志 console.error
      pure: mode === "production" ? ["console.log", "console.debug", "console.info", "console.warn"] : [],
      drop: mode === "production" ? ["debugger"] : [],
    },
    // 根据动态导入的组件来分包
    build: {
      outDir: "dist",
      minify: "esbuild", //压缩代码
      sourcemap: mode !== "production", // 关闭源码痕迹
      chunkSizeWarningLimit: 500, //配置文件大小提醒限制，默认500
      rollupOptions: {
        output: {
          // 用于从入口点创建的块的打包输出格式
          entryFileNames: "assets/js/[name].[hash].js",
          // 用于命名代码拆分时创建的共享块的输出命名
          chunkFileNames: "assets/js/[name].[hash].js",
          // 将 assetFileNames 改为函数，根据文件类型动态返回命名规则
          assetFileNames: (assetInfo: AssetInfo) => {
            // 判断是否为字体文件
            if (/\.(ttf|woff|woff2|eot)$/i.test(assetInfo.name)) {
              // 字体文件不包含 [hash]，仅保留原文件名和扩展名
              return "assets/fonts/[name].[ext]"
            }
            // 其他静态资源（如图片、CSS等）保持原有的带 Hash 命名规则
            return "assets/[ext]/[name].[hash].[ext]"
          },
        },
      },
    },
  })
)
