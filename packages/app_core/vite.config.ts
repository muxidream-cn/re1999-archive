// 此文件为core仓库的自有vite配置，与其他仓库无关
import path from "node:path"
import { URL, fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import IconsResolver from "unplugin-icons/resolver"
import Icons from "unplugin-icons/vite"
import Components from "unplugin-vue-components/vite"
import { defineConfig } from "vite"
import { createSvgIconsPlugin } from "vite-plugin-svg-icons-ng"

// 提取 alias 配置，复用
const aliases = {
  "@": fileURLToPath(new URL("src", import.meta.url)),
  "@components": fileURLToPath(new URL("src/components", import.meta.url)),
  "@serverSchema": fileURLToPath(new URL("../../schema/server", import.meta.url)),
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 .env 文件中的环境变量
  return {
    plugins: [
      vue(),
      AutoImport({
        // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
        imports: ["vue", "vue-router"],
        resolvers: [
          // 自动导入图标组件
          IconsResolver({
            prefix: "Icon",
          }),
        ],
      }),
      Components({
        // 自动导入全局ui组件
        dirs: ["src/components"],
        // 递归扫描子目录
        deep: true,
        // 支持的文件后缀
        extensions: ["vue"],
        // 生成类型声明文件
        dts: "src/components.d.ts",
        // 禁止子目录作为组件的命名空间前缀，解决此目录下的组件名对不上类型，导致无法自动导入
        // ! 但所有全局组件的命名不可重复
        directoryAsNamespace: false,
        resolvers: [
          IconsResolver({
            enabledCollections: ["lucide"], // 可选：限定只解析 lucide 集合
          }),
        ],
      }),
      Icons({
        autoInstall: true,
        compiler: "vue3",
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "../shared-assets/icons")],
        symbolId: "icon-[dir]-[name]",
      }),
      tailwindcss(),
    ],
    base: "/",
    resolve: {
      alias: aliases,
    },
  }
})
