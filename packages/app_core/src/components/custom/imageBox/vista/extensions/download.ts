import { createIconButton, ICONS } from "../icons"

import type { VistaGalleryContext, VistaGalleryExtension } from "../types"

/**
 * 下载按钮扩展
 * 直接按当前索引从列表取原始信息，不再像旧实现那样反查灯箱 DOM 的类名与 data-index
 * @param context 扩展上下文
 */
export const createDownloadExtension = (context: VistaGalleryContext): VistaGalleryExtension => {
  let button: HTMLButtonElement | null = null

  const sync = () => {
    if (button) button.disabled = context.isDownloading()
  }

  return {
    name: "download",
    description: "下载当前壁纸",
    control: () => {
      button = createIconButton(ICONS.download, "下载")
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        if (context.isDownloading()) return
        context.download(context.getIndex())
        sync()
      })
      sync()
      return button
    },
    onOpen: sync,
    onImageView: sync,
    onClose: () => {
      button = null
    },
    sync,
  }
}
