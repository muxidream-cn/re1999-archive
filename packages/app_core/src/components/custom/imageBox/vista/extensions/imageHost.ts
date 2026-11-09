import { unwatchFitBox, VistaImageHost, watchFitBox } from "../imageHost"

import type { VistaGalleryExtension } from "../types"

/**
 * 用自定义图片容器替换库默认实现
 * 目的见 VistaImageHost 的说明：跳过从 0 尺寸开始的补间，并提供缩放复位能力。
 * 尺寸观察也挂在这里：适配逻辑属于宿主自身，随画廊打开/关闭启停，不需要外部再管。
 * 注意：库只取第一个提供 onInitializeImage 的扩展，本扩展必须保持在 extensions 数组首位。
 */
export const createImageHostExtension = (): VistaGalleryExtension => ({
  name: "imageHost",
  description: "图片容器：适配尺寸与缩放复位",
  onInitializeImage: (params) => new VistaImageHost(params),
  onOpen: (vistaView) => {
    watchFitBox(vistaView)
  },
  onClose: () => {
    unwatchFitBox()
  },
})
