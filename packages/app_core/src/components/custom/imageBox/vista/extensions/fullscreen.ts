import { createIconButton, ICONS, setButtonIcon } from "../icons"
import { scheduleReconcile } from "../imageHost"

import type { VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/**
 * 取灯箱根节点（.vvw-root）
 * @param view 画廊实例
 */
const getOverlay = (view: VistaView) => view.imageContainer?.parentElement?.parentElement ?? null

/**
 * 全屏按钮扩展
 * 对灯箱根节点调用 Fullscreen API；Tauri（WebView2）通常可用，
 * Android WebView 等不支持的环境会静默降级为无效操作，不抛错
 */
export const createFullscreenExtension = (): VistaGalleryExtension => {
  let button: HTMLButtonElement | null = null
  let view: VistaView | null = null
  let listening = false

  const sync = () => {
    if (!button) return
    const active = Boolean(document.fullscreenElement)
    setButtonIcon(button, active ? ICONS.exitFullscreen : ICONS.enterFullscreen)
    const label = active ? "退出全屏" : "全屏"
    button.setAttribute("aria-label", label)
    button.title = label
  }

  const exit = () => {
    if (!document.fullscreenElement) return
    void document.exitFullscreen().catch(() => undefined)
  }

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }
      const target = (view && getOverlay(view)) ?? document.documentElement
      await target.requestFullscreen()
    } catch {
      // 部分 WebView 不支持全屏，静默降级
    }
  }

  /**
   * 全屏状态变化
   *
   * 容器宽度是 (2n+1)*100vw、位移用 vw，会随视口自动跟随；但图片尺寸是 JS 写的 px，不会重算，
   * 所以这里要触发一次适配（refit 会顺带复位缩放，相当于「按默认方式匹配容器」）。
   * 不能直接调 refit：fullscreenchange 常常早于视口真正 resize 触发，此刻量到的还是旧尺寸，
   * 幂等判定会把它挡掉。改为唤起收敛循环，由它逐帧对账到落定后的盒子。
   */
  const syncLayout = () => {
    sync()
    scheduleReconcile()
  }

  return {
    name: "fullscreen",
    description: "全屏",
    control: () => {
      button = createIconButton(ICONS.enterFullscreen, "全屏")
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        void toggle()
      })
      sync()
      return button
    },
    onOpen: (vistaView) => {
      view = vistaView
      if (!listening) {
        document.addEventListener("fullscreenchange", syncLayout)
        listening = true
      }
      sync()
    },
    onClose: () => {
      if (listening) {
        document.removeEventListener("fullscreenchange", syncLayout)
        listening = false
      }
      view = null
      button = null
      exit()
    },
    sync,
  }
}
