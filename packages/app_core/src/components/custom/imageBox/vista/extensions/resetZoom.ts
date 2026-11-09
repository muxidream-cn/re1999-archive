import { createIconButton, ICONS } from "../icons"
import { VistaImageHost, ZOOM_RESET_EVENT } from "../imageHost"

import type { VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/**
 * 还原默认大小扩展
 * 把被双指、滚轮或放大按钮放大的图片带过渡地还原成适配屏幕的尺寸；
 * 未放大时按钮保持禁用，切换图片/打开画廊时按当前图片状态刷新
 */
export const createResetZoomExtension = (): VistaGalleryExtension => {
  let button: HTMLButtonElement | null = null
  let view: VistaView | null = null
  /** close() 会先把 root 与 imageContainer 置空，这里得自己留一份才能解绑 */
  let root: HTMLElement | null = null

  /** 取当前居中的图片容器，非本扩展创建的实现则视为不可操作 */
  const currentHost = () => {
    const box = view?.state.children.images.find((image) => image.pos === 0)
    return box instanceof VistaImageHost ? box : null
  }

  const sync = () => {
    if (!button) return
    button.disabled = !(view?.state.zoomedIn ?? false)
  }

  const reset = () => {
    const host = currentHost()
    if (!host) return
    void host.resetZoom().then(sync)
  }

  return {
    name: "resetZoom",
    description: "还原默认大小",
    control: () => {
      button = createIconButton(ICONS.fitScreen, "还原默认大小")
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        reset()
      })
      sync()
      return button
    },
    onOpen: (vistaView) => {
      view = vistaView
      root = vistaView.imageContainer?.closest<HTMLElement>(".vvw-root") ?? null
      // 进出全屏、窗口尺寸变化都会把缩放复位成适配态，这条事件让按钮立刻回到禁用，
      // 不用等补间动画结束（原先只有 onContentChange，复位路径不经过它）
      root?.addEventListener(ZOOM_RESET_EVENT, sync)
      sync()
    },
    onImageView: (_data, vistaView) => {
      view = vistaView
      // swap() 内已把 state.zoomedIn 置 false，这里刷新即可
      sync()
    },
    // 缩放/平移动画落定时库会触发该回调，是按钮状态的主要刷新入口
    onContentChange: sync,
    onClose: () => {
      root?.removeEventListener(ZOOM_RESET_EVENT, sync)
      root = null
      view = null
      button = null
    },
    sync,
  }
}
