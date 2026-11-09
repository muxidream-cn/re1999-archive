import { createIconButton, ICONS, setButtonIcon } from "../icons"

import type { VistaGalleryContext, VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/** 自动播放间隔（毫秒） */
const INTERVAL = 3000

/**
 * 自动播放扩展
 * 库本身没有轮播能力，这里用定时器驱动 next()，到末张停止（库的 next() 会循环，必须自己拦）
 * @param context 扩展上下文
 */
export const createAutoplayExtension = (context: VistaGalleryContext): VistaGalleryExtension => {
  let button: HTMLButtonElement | null = null
  let view: VistaView | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  const sync = () => {
    if (!button) return
    const playing = timer !== null
    setButtonIcon(button, playing ? ICONS.pause : ICONS.play, true)
    const label = playing ? "暂停自动播放" : "自动播放"
    button.setAttribute("aria-label", label)
    button.title = label
    button.disabled = context.getList().length < 2
  }

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    sync()
  }

  const start = () => {
    if (context.getList().length < 2) return
    stop()
    timer = setInterval(() => {
      if (!view) {
        stop()
        return
      }
      const index = view.getCurrentIndex()
      if (index < 0 || index >= context.getList().length - 1) {
        stop()
        return
      }
      view.next()
    }, INTERVAL)
    sync()
  }

  return {
    name: "autoplay",
    description: "自动播放",
    control: () => {
      button = createIconButton(ICONS.play, "自动播放", true)
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        if (timer !== null) stop()
        else start()
      })
      sync()
      return button
    },
    onOpen: (vistaView) => {
      view = vistaView
      sync()
    },
    onImageView: (_data, vistaView) => {
      view = vistaView
    },
    onClose: () => {
      stop()
      button = null
      view = null
    },
    sync,
  }
}
