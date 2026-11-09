import { createIconButton, ICONS } from "../icons"
import { refitCurrentImage, setImmersive } from "../imageHost"

import type { VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/**
 * 沉浸模式扩展
 *
 * 进入按钮挂在顶部工具栏，与其他控件保持一致；退出按钮不能复用工具栏——
 * 沉浸时工具栏本身已经滑出画面，放在里面就点不到了，所以单独做一个绝对定位的悬浮按钮，
 * 挂在灯箱根节点上，不参与布局、不占安全区，全屏大图不会被它挤小。
 */
export const createImmersiveExtension = (): VistaGalleryExtension => {
  let restoreButton: HTMLButtonElement | null = null
  let view: VistaView | null = null
  let immersive = false

  /** 同步悬浮按钮的可达性，避免它隐藏时还能被 Tab 选中 */
  const syncRestoreButton = () => {
    if (!restoreButton) return
    restoreButton.tabIndex = immersive ? 0 : -1
    restoreButton.setAttribute("aria-hidden", String(!immersive))
  }

  /**
   * 切换沉浸模式
   * @param on 是否进入沉浸
   */
  const toggle = (on: boolean) => {
    if (!view || immersive === on) return

    immersive = on
    setImmersive(view, on)
    syncRestoreButton()
    // 容器高度已经变了，这里重算适配尺寸并补间过去；放大状态下同样会复位到铺满视图
    void refitCurrentImage(view)
  }

  return {
    name: "immersive",
    description: "只看大图 / 恢复界面",
    control: () => {
      const entryButton = createIconButton(ICONS.eyeOff, "只看大图")
      entryButton.addEventListener("click", (event) => {
        event.stopPropagation()
        toggle(true)
      })
      return entryButton
    },
    onOpen: (vistaView) => {
      view = vistaView
      immersive = false

      restoreButton = createIconButton(ICONS.eye, "恢复界面")
      restoreButton.classList.add("vvg-restore")
      restoreButton.addEventListener("click", (event) => {
        event.stopPropagation()
        toggle(false)
      })
      syncRestoreButton()
      // 根节点在关闭时整体移除，按钮跟着销毁，不需要在这里手动摘除
      vistaView.imageContainer?.closest(".vvw-root")?.appendChild(restoreButton)
    },
    onClose: () => {
      view = null
      immersive = false
      restoreButton = null
    },
  }
}
