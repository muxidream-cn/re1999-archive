// 此文件为其他仓库的公共vite配置，与core仓库无关
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
import VueDevTools from "vite-plugin-vue-devtools"

export const sharedAliases = {
  "@app/core": fileURLToPath(new URL("./src", import.meta.url)),
  "@serverSchema": fileURLToPath(new URL("../../schema/server", import.meta.url)),
}

export const sharedConfig = defineConfig({
  server: {
    watch: {
      ignored: ["**/*.md"],
    },
  },
  plugins: [
    vue(),
    VueDevTools(),
    AutoImport({
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ["vue", "vue-router"],
      dts: fileURLToPath(new URL("./auto-imports.d.ts", import.meta.url)),
      resolvers: [
        // 自动导入图标组件
        IconsResolver({ prefix: "Icon" }),
      ],
    }),
    Components({
      // 自动导入components目录下的ui组件
      dirs: [path.resolve(process.cwd(), "src/components"), fileURLToPath(new URL("./src/components/ui", import.meta.url))],
      // 递归扫描子目录
      deep: true,
      // 支持的文件后缀
      extensions: ["vue"],
      // 生成类型声明文件
      dts: fileURLToPath(new URL("./components.d.ts", import.meta.url)),
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
      iconDirs: [path.resolve(fileURLToPath(new URL("../shared-assets/icons", import.meta.url)))],
      symbolId: "icon-[dir]-[name]",
    }),
    tailwindcss(),
  ],
  //部署在主路径使用base:“/”(默认状态)，部署在子路径则使用base:“/ProjectName/”
  //webHistory模式下不能使用相对路径base:“./”
  base: "/",
  resolve: {
    alias: sharedAliases,
    // monorepo 下同一个依赖会因 peer 解析差异被 pnpm 装成两份物理副本，两份副本各自生成自己的 Symbol，
    // 跨副本取上下文（provide/inject、store、插件注册）会失败，且生产构建下异常会被静默吞掉。
    // 这里强制这些库只解析到应用根目录的那一份。
    // 注意：vue-router 已由 app_core 独占引用（路由表与 createAppRouter 均在 app_core 内），
    // 产物里不可能出现两份，故不再列入；若将来某端重新直接 import vue-router，需要把它加回来。
    // vistaview 有模块级单例（同一时刻只允许一个实例打开）并向 body 挂载 DOM、注入全局样式，
    // 出现两份物理副本会导致实例互不可见与样式重复，必须参与去重。
    dedupe: ["vue", "pinia", "reka-ui", "@vueuse/core", "@vueuse/motion", "vistaview"],
  },
  optimizeDeps: {},
  // 开启并指定缓存目录，加快构建速度
  cacheDir: "node_modules/.vite",
})
