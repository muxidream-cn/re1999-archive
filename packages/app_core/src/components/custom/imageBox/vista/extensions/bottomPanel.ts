import { ICONS, setButtonIcon } from "../icons"

import type { VistaGalleryContext, VistaGalleryExtension } from "../types"
import type { VistaView } from "vistaview"

/** 缩略图预加载边距：进入容器可视区左右各 240px 内才真正请求图片 */
const LAZY_MARGIN = "0px 240px"
/** 判定为拖动的最小位移（px），低于该值视为点击 */
const DRAG_THRESHOLD = 6

/** 系统是否要求减少动态效果 */
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * 底部面板扩展
 * 一个控件内竖向堆叠：角色名说明、横向缩略图带。
 * 两者放在同一个控件里，是因为库的 bottom 工具栏按槽位横向排布，
 * 拆成多个控件会被并排摆放，无法形成截图中的上下结构。
 *
 * 缩略图带策略：全量渲染轻量 button（不含 img），图片用 IntersectionObserver 按可见性懒加载。
 * 之所以不用「只渲染当前索引前后若干张」，是因为开窗渲染会让拖不动窗口之外的项。
 * 代价是列表极大时 DOM 节点偏多（每项两个属性、无图片节点），实际使用规模内可接受。
 * @param context 扩展上下文
 */
export const createBottomPanelExtension = (context: VistaGalleryContext): VistaGalleryExtension => {
  let view: VistaView | null = null
  let wrapper: HTMLDivElement | null = null
  let caption: HTMLDivElement | null = null
  let strip: HTMLDivElement | null = null
  let observer: IntersectionObserver | null = null
  let scrollRow: HTMLDivElement | null = null
  let prevButton: HTMLButtonElement | null = null
  let nextButton: HTMLButtonElement | null = null
  let stripResizeObserver: ResizeObserver | null = null
  /** rAF 句柄，用于合并滚动过程中的按钮状态刷新 */
  let scrollRaf = 0
  /** 当前高亮的缩略图按钮，避免每次切图都遍历全部节点 */
  let activeThumb: HTMLButtonElement | null = null
  /** 打开时的首次刷新不做平滑滚动，避免一进画廊缩略图带就滑一段 */
  let firstRefresh = true

  //#region 拖动状态
  let dragOriginX = 0
  let dragOriginScroll = 0
  let mouseDragging = false
  /** 当前按下的指针 id，用于过滤非本次交互的 move 事件 */
  let dragPointerId: number | null = null
  /** 按下时命中的缩略图，用于 click 的 target 被提升为祖先时兜底 */
  let pressedThumb: HTMLButtonElement | null = null
  /** 本次指针交互是否构成拖动，用于吞掉拖动结束时误触的那次 click */
  let dragged = false
  //#endregion

  const describe = (index: number) => {
    const item = context.getList()[index]
    const text = context.getCaption(index) || item?.name || ""
    return text ? `第 ${index + 1} 张：${text}` : `第 ${index + 1} 张`
  }

  /**
   * 为缩略图按钮补上图片，已存在则跳过
   * @param button 缩略图按钮
   */
  const ensureThumbImage = (button: HTMLButtonElement) => {
    if (button.querySelector("img")) return
    const index = Number(button.dataset.index)
    if (!Number.isFinite(index)) return

    const image = document.createElement("img")
    image.loading = "lazy"
    image.decoding = "async"
    image.alt = ""
    // img 默认 draggable=true，在图片上按住移动会触发原生 HTML5 拖拽，
    // 派发 dragstart 后 pointermove 不再送达，拖动逻辑会完全失效
    image.draggable = false

    image.addEventListener("load", () => {
      // 加载完成那一下整条带的总宽会变：高亮项要重新居中一次
      if (button.classList.contains("is-active")) centerActive(button, false)
      // 刷新左右按钮可用态必须走 rAF 合并：直接同步调用会读 scrollWidth，
      // 等于每张缩略图加载都强制一次整页布局
      scheduleScrollButtons()
    })
    image.src = context.getThumb(index)
    button.appendChild(image)
  }

  /**
   * 把当前项滚动到缩略图带中间
   * 只操作 strip 自身的 scrollLeft：库把 .vvw-image-container 撑到数倍视口宽，
   * 其父级 .vvw-container 虽为 overflow:hidden 却可被程序化滚动，
   * 一旦用 scrollIntoView 就会连带把整个灯箱图层推出视口
   * @param active 当前高亮的缩略图按钮
   * @param smooth 是否平滑滚动
   */
  const centerActive = (active: HTMLButtonElement, smooth: boolean) => {
    if (!strip) return

    const stripRect = strip.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const delta = activeRect.left - stripRect.left - (stripRect.width - activeRect.width) / 2
    if (Math.abs(delta) < 1) return

    strip.scrollTo({
      left: strip.scrollLeft + delta,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    })
    scheduleScrollButtons()
  }

  /**
   * 切换当前项高亮并居中
   * 只改动前后两个按钮的类名，避免每次切图都遍历全部缩略图
   * @param smooth 是否平滑滚动
   */
  const highlight = (smooth: boolean) => {
    if (!strip) return
    const current = context.getIndex()
    const next = strip.querySelector<HTMLButtonElement>(`.vvg-thumb[data-index="${current}"]`)

    if (activeThumb && activeThumb !== next) {
      activeThumb.classList.remove("is-active")
      activeThumb.removeAttribute("aria-current")
    }

    activeThumb = next
    if (!next) return

    next.classList.add("is-active")
    next.setAttribute("aria-current", "true")
    // 高亮项可能还没被观察器加载过，直接补上，避免选中项空白
    ensureThumbImage(next)
    centerActive(next, smooth)
  }

  const renderStrip = () => {
    if (!strip) return
    const list = context.getList()

    observer?.disconnect()
    strip.innerHTML = ""
    activeThumb = null

    const fragment = document.createDocumentFragment()
    for (let index = 0; index < list.length; index += 1) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "vvg-thumb"
      button.dataset.index = `${index}`
      button.setAttribute("aria-label", describe(index))
      fragment.appendChild(button)
    }
    strip.appendChild(fragment)

    // 观察器必须在 strip 已进入文档后创建，否则 root 无效会退化为视口判定
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ensureThumbImage(entry.target as HTMLButtonElement)
          observer?.unobserve(entry.target)
        })
      },
      { root: strip, rootMargin: LAZY_MARGIN }
    )
    strip.querySelectorAll<HTMLButtonElement>(".vvg-thumb").forEach((element) => observer?.observe(element))

    highlight(false)
    // DOM 全量重建后缩略图总宽变化，必须立即刷新按钮可用态
    updateScrollButtons()
  }

  /**
   * 刷新说明文字与高亮状态
   * @param smooth 是否平滑滚动
   */
  const refresh = (smooth: boolean) => {
    if (!context.getList().length) return
    if (caption) caption.textContent = context.getCaption(context.getIndex())
    highlight(smooth)
  }

  //#region 滚动按钮
  /** 依据缩略图带的实际滚动位置刷新左右按钮的可用状态 */
  const updateScrollButtons = () => {
    if (!strip || !prevButton || !nextButton) return
    // 尚未完成布局时 clientWidth 为 0，此时不能判定为「不可滚动」
    if (strip.clientWidth === 0) return

    const max = strip.scrollWidth - strip.clientWidth
    const scrollable = max > 1
    prevButton.disabled = !scrollable || strip.scrollLeft <= 1
    nextButton.disabled = !scrollable || strip.scrollLeft >= max - 1
  }

  /** 用 rAF 合并滚动过程中的状态刷新，避免平滑滚动时每帧多次读写布局 */
  const scheduleScrollButtons = () => {
    if (scrollRaf) return
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0
      updateScrollButtons()
    })
  }

  /**
   * 按可视宽度的 80% 横向滚动缩略图带，只滚动不切图
   * @param direction -1 向左，1 向右
   */
  const scrollStripBy = (direction: -1 | 1) => {
    if (!strip) return
    strip.scrollBy({
      left: direction * Math.max(strip.clientWidth * 0.8, 1),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  /**
   * 创建缩略图带左右滚动按钮
   * @param direction -1 向左，1 向右
   */
  const createScrollButton = (direction: -1 | 1) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "vvg-scroll"
    button.dataset.dir = direction < 0 ? "prev" : "next"

    const label = direction < 0 ? "向左滚动缩略图" : "向右滚动缩略图"
    button.title = label
    button.setAttribute("aria-label", label)
    setButtonIcon(button, direction < 0 ? ICONS.chevronLeft : ICONS.chevronRight)
    // 初始不可用，渲染完缩略图带后再由 updateScrollButtons 校正
    button.disabled = true
    button.addEventListener("click", (event) => {
      event.stopPropagation()
      scrollStripBy(direction)
    })

    return button
  }
  //#endregion

  //#region 拖动
  /**
   * 结束拖动并复位标记
   * click 在 pointerup 之后同步派发，因此用 0ms 定时器复位既能让本次 click 被吞掉，又不会影响下一次点击
   * @param element 缩略图带
   */
  const endDrag = (element: HTMLDivElement) => {
    mouseDragging = false
    dragPointerId = null
    element.classList.remove("is-dragging")
    if (!dragged) return
    window.setTimeout(() => {
      dragged = false
    }, 0)
  }

  /**
   * 绑定拖动交互
   * 鼠标接管滚动（桌面端 overflow 容器无法用鼠标拖动）；
   * 触摸与触控笔交给浏览器原生横向滚动，这里只记录位移用于抑制误触
   * @param element 缩略图带
   */
  const bindDrag = (element: HTMLDivElement) => {
    element.addEventListener("pointerdown", (event) => {
      dragged = false
      if (event.pointerType === "mouse" && event.button !== 0) return

      dragPointerId = event.pointerId
      dragOriginX = event.clientX
      dragOriginScroll = element.scrollLeft
      mouseDragging = event.pointerType === "mouse"
      // 兜底：部分内核即使不走 capture 也会提升 click 的 target，这里记下按下的缩略图
      pressedThumb = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".vvg-thumb") ?? null
      // 注意：不能在这里 setPointerCapture。
      // 一旦捕获，pointerup 的目标会变成 strip，浏览器据此把 click 的 target 抬到共同祖先，
      // event.target.closest(".vvg-thumb") 就取不到按钮，点击切图会完全失效。
      // 捕获推迟到真正进入拖动时再设置。
    })

    element.addEventListener("pointermove", (event) => {
      if (dragPointerId === null || event.pointerId !== dragPointerId) return

      if (!mouseDragging) {
        if (Math.abs(event.clientX - dragOriginX) > DRAG_THRESHOLD) dragged = true
        return
      }

      const delta = event.clientX - dragOriginX
      if (!dragged && Math.abs(delta) > DRAG_THRESHOLD) {
        dragged = true
        element.classList.add("is-dragging")
        // 进入拖动后才捕获指针，保证拖出缩略图带范围仍能持续收到移动事件
        try {
          element.setPointerCapture(event.pointerId)
        } catch {
          // 指针已失效（例如被系统中断），退化为不捕获，不影响后续点击
        }
      }
      if (!dragged) return

      event.preventDefault()
      element.scrollLeft = dragOriginScroll - delta
    })

    element.addEventListener("pointerup", (event) => {
      // 触摸端原生滚动时可能拿不到 pointermove，这里用抬起坐标补一次位移判定，
      // 避免实际划过一段距离却被当成点击而误切图
      if (dragPointerId !== null && !dragged && Math.abs(event.clientX - dragOriginX) > DRAG_THRESHOLD) {
        dragged = true
      }
      endDrag(element)
    })
    element.addEventListener("pointercancel", () => endDrag(element))

    // 兜底：即使某个内核仍对 img 发起原生拖拽，也在这里拦掉，
    // 只 preventDefault，不 stopPropagation，避免影响其他逻辑
    element.addEventListener("dragstart", (event) => event.preventDefault())
  }
  //#endregion

  return {
    name: "bottomPanel",
    description: "说明文字与缩略图导航",
    control: () => {
      wrapper = document.createElement("div")
      // 尺寸差异交给 vista-theme.css 的 Tailwind md 媒体查询，不再由 JS 挂 is-mobile 类，
      // 避免「JS 判断（UA 命中也算移动端）」和「CSS 判断（只看视口）」各留一套互相打架的开关
      wrapper.className = "vvg-bottom"

      caption = document.createElement("div")
      caption.className = "vvg-caption"

      const stripEl = document.createElement("div")
      stripEl.className = "vvg-thumbs"
      stripEl.setAttribute("role", "tablist")
      stripEl.addEventListener("click", (event) => {
        // 拖动结束后的那次 click 不切图
        if (dragged) return
        // 正常情况下 event.target 就是缩略图；若被指针捕获提升为祖先，则回退到按下时命中的那一张
        const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".vvg-thumb") ?? pressedThumb
        if (!target) return
        event.stopPropagation()
        const index = Number(target.dataset.index)
        if (!Number.isFinite(index) || index === context.getIndex()) return
        view?.view(index)
      })
      bindDrag(stripEl)
      strip = stripEl

      scrollRow = document.createElement("div")
      scrollRow.className = "vvg-thumbs-row"
      prevButton = createScrollButton(-1)
      nextButton = createScrollButton(1)
      scrollRow.append(prevButton, stripEl, nextButton)

      wrapper.append(caption, scrollRow)

      // 必须在这里就写入说明文字：大图的可用高度依赖底栏实际高度，
      // 而测量发生在更早的图片构造阶段，等 onOpen 再赋值会漏掉这段文字的高度
      if (caption) caption.textContent = context.getCaption(context.getIndex())

      return wrapper
    },
    onOpen: (vistaView) => {
      view = vistaView
      firstRefresh = true
      // 缩略图带必须挂到文档后再渲染：IntersectionObserver 的 root 需要是已挂载的滚动容器
      renderStrip()
      if (caption) caption.textContent = context.getCaption(context.getIndex())

      // 滚动位置由平滑滚动、手动拖动共同改变，只能靠 scroll 事件持续同步按钮状态
      strip?.addEventListener("scroll", scheduleScrollButtons, { passive: true })
      stripResizeObserver?.disconnect()
      if (strip) {
        stripResizeObserver = new ResizeObserver(scheduleScrollButtons)
        stripResizeObserver.observe(strip)
      }
      updateScrollButtons()
    },
    onImageView: () => {
      refresh(!firstRefresh)
      firstRefresh = false
    },
    onClose: () => {
      observer?.disconnect()
      observer = null
      strip?.removeEventListener("scroll", scheduleScrollButtons)
      stripResizeObserver?.disconnect()
      stripResizeObserver = null
      if (scrollRaf) {
        cancelAnimationFrame(scrollRaf)
        scrollRaf = 0
      }
      activeThumb = null
      view = null
      wrapper = null
      caption = null
      strip = null
      scrollRow = null
      prevButton = null
      nextButton = null
      mouseDragging = false
      dragPointerId = null
      pressedThumb = null
      dragged = false
    },
  }
}
