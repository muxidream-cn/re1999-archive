/// <reference types="vite/client" />
declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module "*.{png,jpg,jpeg,gif,svg,mp3,mp4,webm,ogg}" {
  const src: string
  export default src
}

declare module "*.svg?raw" {
  const content: string
  export default content
}

/**
 * 条件编译插件没有内置类型声明，按 1.0.1 源码补充最小声明
 * - @see https://github.com/pglin66/vite-plugin-region-ifdef/tree/main
 */
declare module "vite-plugin-region-ifdef" {
  export default function regionIfdef(
    options?: Record<string, boolean | string | number | RegExp | readonly (string | RegExp)[] | undefined>
  ): import("vite").Plugin
}