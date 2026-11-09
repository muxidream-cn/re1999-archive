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