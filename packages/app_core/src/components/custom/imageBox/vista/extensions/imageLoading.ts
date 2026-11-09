import { IMAGE_LOADED_EVENT } from "../imageHost"

import type { VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/** loading 延迟出现的时长：命中缓存时原图几乎是秒到，立刻显示只会闪一帧 */
const SHOW_DELAY_MS = 150
/** 序号块与 loading 之间的垂直间距 */
const INDICATOR_GAP = 6

/**
 * 原图加载提示扩展
 *
 * 在主图（原图）解码完成之前，于左上角序号下方显示一个旋转指示器。
 * 之所以挂在顶栏上而不是序号块内部：库的 displayCurrentInfo() 每切一张都会
 * 直接改写 `.vvw-index` 的 textContent，挂里面的子元素会被整块抹掉。
 * 位置按序号块的实际矩形逐张量一次（页数从 9 变 10 时序号宽度会跟着变），
 * 用重排无关的绝对定位写进 inline style。
 */
export const createImageLoadingExtension = (): VistaGalleryExtension => {
  let root: HTMLElement | null = null
  let topBar: HTMLElement | null = null
  let indexDisplay: HTMLElement | null = null
  let indicator: HTMLSpanElement | null = null
  let showTimer = 0

  const clearTimer = () => {
    if (!showTimer) return
    window.clearTimeout(showTimer)
    showTimer = 0
  }

  /**
   * 当前正在展示的这张原图是否已经解码完成
   * @param view 画廊实例
   */
  const isCurrentLoaded = (view: VistaView) => {
    const current = view.state.children.images.find((image) => image.pos === 0)
    return current?.isReady ?? false
  }

  /** 把指示器摆到序号正下方 */
  const positionIndicator = () => {
    if (!topBar || !indexDisplay || !indicator) return

    const barRect = topBar.getBoundingClientRect()
    const indexRect = indexDisplay.getBoundingClientRect()

    indicator.style.left = `${indexRect.left - barRect.left + indexRect.width / 2}px`
    indicator.style.top = `${indexRect.bottom - barRect.top + INDICATOR_GAP}px`
  }

  const hide = () => {
    clearTimer()
    if (indicator) indicator.hidden = true
  }

  /** 延时显示：真·慢加载才出现，避免快图闪一下 */
  const scheduleShow = () => {
    clearTimer()
    if (!indicator) return

    showTimer = window.setTimeout(() => {
      showTimer = 0
      if (indicator) indicator.hidden = false
    }, SHOW_DELAY_MS)
  }

  /**
   * 按当前图片状态决定指示器是否该转
   * @param view 画廊实例
   */
  const sync = (view: VistaView) => {
    positionIndicator()
    if (isCurrentLoaded(view)) hide()
    else scheduleShow()
  }

  return {
    name: "imageLoading",
    description: "原图加载提示：左上角序号下方显示 loading",
    onOpen: (vistaView) => {
      root = vistaView.imageContainer?.closest<HTMLElement>(".vvw-root") ?? null
      topBar = root?.querySelector<HTMLElement>(".vvw-top-bar") ?? null
      indexDisplay = topBar?.querySelector<HTMLElement>(".vvw-index") ?? null
      if (!root || !topBar || !indexDisplay) return

      indicator = document.createElement("span")
      indicator.className = "vvg-image-loading"
      indicator.hidden = true
      indicator.setAttribute("role", "status")
      indicator.setAttribute("aria-label", "正在加载原图")
      topBar.appendChild(indicator)

      root.addEventListener(IMAGE_LOADED_EVENT, hide)
      // 打开时原图早就在请求了（图片实例构造里就发了），此时可能已经解码完成，
      // 所以不能无条件显示，按 isReady 判一次
      sync(vistaView)
    },
    onImageView: (_data, vistaView) => {
      // 库先把序号文本写好再调本钩子，这里量到的就是新序号的矩形
      sync(vistaView)
    },
    onClose: () => {
      clearTimer()
      root?.removeEventListener(IMAGE_LOADED_EVENT, hide)
      indicator?.remove()
      root = null
      topBar = null
      indexDisplay = null
      indicator = null
    },
  }
}
