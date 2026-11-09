import { IMAGE_READY_EVENT } from "../imageHost"

import type { VistaGalleryExtension } from "../types"

/** 锁的最短保持时间：库的过渡是 animationDurationBase(333ms)，太早放行会看到动画未完就翻下一页 */
const MIN_LOCK_MS = 340
/** 兜底释放：图片加载异常时不能让翻页永久卡死 */
const MAX_LOCK_MS = 1600

/** 参与节流的翻页按钮：两侧箭头 */
const PAGING_BUTTON_SELECTOR = ".vvw-prev > button, .vvw-next > button"

/**
 * 翻页节流扩展
 *
 * 库的 prev() / next() 没有锁：过渡还在跑就再点，会把上一张的图片实例直接 destroy 掉，
 * 而那张往往还没解码完，于是画面从 A 直接跳到 C，看起来就是「瞬间切换至下下张」。
 *
 * 这里用一个 switching 标志挡住翻页期间的点击，放行条件是两个都满足：
 * 1. 距点击已过过渡时长；
 * 2. 新图已渲染就位（imageHost 在 init 完成后派发 IMAGE_READY_EVENT）。
 * 只按时间放行不够——网速慢时新图还没出来就允许再翻，仍会跳张。
 */
export const createPagingThrottleExtension = (): VistaGalleryExtension => {
  let root: HTMLElement | null = null
  /** 翻页进行中 */
  let switching = false
  /** 本次点击的时间 */
  let requestedAt = 0
  /** 新图就位的时间，0 表示还没就位 */
  let readyAt = 0
  let minTimer: number | null = null
  let maxTimer: number | null = null

  /** 清掉两个定时器 */
  const clearTimers = () => {
    if (minTimer !== null) {
      window.clearTimeout(minTimer)
      minTimer = null
    }
    if (maxTimer !== null) {
      window.clearTimeout(maxTimer)
      maxTimer = null
    }
  }

  /** 放行下一次翻页 */
  const release = () => {
    clearTimers()
    switching = false
    readyAt = 0
  }

  /** 新图就位后判断是否还要等过渡播完 */
  const tryRelease = () => {
    if (!switching || !readyAt) return

    const remain = MIN_LOCK_MS - (readyAt - requestedAt)
    if (remain <= 0) {
      release()
      return
    }

    if (minTimer !== null) window.clearTimeout(minTimer)
    minTimer = window.setTimeout(release, remain)
  }

  /**
   * 捕获阶段拦截翻页点击
   * @param event 点击事件
   */
  const onCaptureClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target?.closest(PAGING_BUTTON_SELECTOR)) return

    if (switching) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    switching = true
    requestedAt = performance.now()
    readyAt = 0
    clearTimers()
    maxTimer = window.setTimeout(release, MAX_LOCK_MS)
  }

  /** 新图渲染就位 */
  const onImageReady = () => {
    if (!switching) return
    readyAt = performance.now()
    tryRelease()
  }

  return {
    name: "pagingThrottle",
    description: "翻页节流：上一页未显示完成时忽略连点",
    onOpen: (vistaView) => {
      root = vistaView.imageContainer?.closest<HTMLElement>(".vvw-root") ?? null
      root?.addEventListener("click", onCaptureClick, true)
      root?.addEventListener(IMAGE_READY_EVENT, onImageReady)
    },
    onClose: () => {
      root?.removeEventListener("click", onCaptureClick, true)
      root?.removeEventListener(IMAGE_READY_EVENT, onImageReady)
      root = null
      release()
    },
  }
}
