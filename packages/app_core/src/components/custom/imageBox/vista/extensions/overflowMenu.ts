import { createIconButton, ICONS } from "../icons"

import type { VistaGalleryExtension } from "../types"

/** more 控件名，buildControls 里排布顶栏时要用同一个名字 */
export const OVERFLOW_MENU_NAME = "overflowMore"
/** 溢出判定容差，吸收边框与亚像素误差 */
const OVERFLOW_TOLERANCE = 1
/** 控件被搬走后留在原位的注释节点内容，展开时按它把控件放回原处 */
const SLOT_COMMENT = "vvg-overflow-slot"

/** 溢出菜单配置 */
export type OverflowMenuOptions = {
  /** 溢出时需要收进菜单的扩展，数组顺序即菜单里的排列顺序 */
  items: VistaGalleryExtension[]
}

/**
 * 顶部工具栏溢出菜单
 *
 * 移动端右侧工具组在窄屏（360px 级别）放不下，挤压时整组会被 .vvw-container 的 overflow: clip 裁掉，
 * 表现为「全屏 / 自动播放」等按钮直接消失且点不到。这里按顶部工具栏的实际宽度测量：
 * 放不下就把 items 移进 more 菜单，放得下再移回工具栏原位。
 *
 * 测量前必须先恢复展开态——收起后的布局必然不溢出，直接量会一直停在收起状态。
 * 「展开 → 读 scrollWidth（强制重排）→ 恢复到合适状态」都在同一个任务里完成，中间没有绘制帧，看不到抖动。
 * @param options 溢出菜单配置
 * @param options.items 需要收起的扩展，顺序即菜单里的排列顺序
 */
export const createOverflowMenuExtension = ({ items }: OverflowMenuOptions): VistaGalleryExtension => {
  let button: HTMLButtonElement | null = null
  let menu: HTMLDivElement | null = null
  let bar: HTMLElement | null = null
  let trigger: HTMLElement | null = null
  let slot: HTMLElement | null = null
  /** 控件 → 原位占位注释，收起期间原位留一个占位，展开时按它还原 */
  const placeholders = new Map<HTMLElement, Comment>()
  let nodes: HTMLElement[] = []
  let collapsed = false

  /**
   * 点菜单以外的地方就收起
   * @param event 文档上的 pointerdown
   */
  const onDocumentPointerDown = (event: Event) => {
    const target = event.target
    if (!(target instanceof Node)) return
    if (menu?.contains(target) || trigger?.contains(target)) return
    setOpen(false)
  }

  /**
   * 打开 / 关闭菜单
   * @param open 目标状态
   */
  const setOpen = (open: boolean) => {
    if (!menu) return
    menu.hidden = !open
    button?.setAttribute("aria-expanded", String(open))
    if (open) document.addEventListener("pointerdown", onDocumentPointerDown, true)
    else document.removeEventListener("pointerdown", onDocumentPointerDown, true)
  }

  /**
   * 按目标状态搬移控件
   * @param collapse 是否收起进菜单
   */
  const applyLayout = (collapse: boolean) => {
    if (!trigger) return
    // more 的显隐每帧都要和状态对齐；控件搬移只在状态真的翻转时才做
    const changed = collapsed !== collapse
    collapsed = collapse
    trigger.style.display = collapse ? "" : "none"
    if (!changed) return

    if (collapse) {
      setOpen(false)
      // 收起项在工具栏里不一定相邻（中间隔着放大 / 重置），所以每个控件都留一个注释占位，
      // 展开时按占位还原，顺序与声明完全一致，不依赖它们在工具栏里连续排列
      nodes.forEach((node) => {
        if (!placeholders.has(node)) {
          const slotMark = document.createComment(SLOT_COMMENT)
          node.before(slotMark)
          placeholders.set(node, slotMark)
        }
        menu?.appendChild(node)
      })
      return
    }

    nodes.forEach((node) => {
      const slotMark = placeholders.get(node)
      if (slotMark?.parentNode) slotMark.replaceWith(node)
      // 占位被人为移除时兜底塞回工具组末尾，至少按钮不会凭空消失
      else slot?.appendChild(node)
    })
    placeholders.clear()
  }

  /** 量一次宽度并切到不溢出的布局 */
  const measure = () => {
    if (!bar) return
    applyLayout(false)
    // 读 scrollWidth 触发重排，展开态的真实内容宽度到这一步才成立
    applyLayout(bar.scrollWidth > bar.clientWidth + OVERFLOW_TOLERANCE)
  }

  return {
    name: OVERFLOW_MENU_NAME,
    description: "更多",
    control: () => {
      button = createIconButton(ICONS.more, "更多", true)
      button.setAttribute("aria-haspopup", "true")
      button.setAttribute("aria-expanded", "false")
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        // hidden 在部分 TS 版本里是 boolean | "until-found"，只有明确的 false 才算「正显示」
        setOpen(menu?.hidden !== false)
      })
      return button
    },
    onOpen: (vistaView) => {
      const root = vistaView.imageContainer?.closest<HTMLElement>(".vvw-root") ?? null
      bar = root?.querySelector<HTMLElement>(".vvw-top-bar") ?? null
      // 顶栏第三个子元素是右侧工具组；三点定位必须在挂菜单之前完成，挂上去后它就不再是最后一个子节点
      const slotElement = bar?.lastElementChild
      slot = slotElement instanceof HTMLElement ? slotElement : null
      trigger = slot?.querySelector<HTMLElement>(`[data-vvw-control="${OVERFLOW_MENU_NAME}"]`) ?? null
      nodes = items
        .map((item) => slot?.querySelector<HTMLElement>(`[data-vvw-control="${item.name}"]`) ?? null)
        .filter((node): node is HTMLElement => node !== null)

      // 控件没渲染出来（扩展不在 controls 里）就把入口藏掉，避免留下一个点了没反应的 more
      if (!bar || !trigger || !nodes.length) {
        if (trigger) trigger.style.display = "none"
        return
      }

      menu = document.createElement("div")
      menu.className = "vvg-more-menu"
      menu.hidden = true
      bar.appendChild(menu)

      collapsed = false
      measure()
      // 转屏、进出全屏、窗口缩放都要重新判定；全屏切换同样会触发 resize
      window.addEventListener("resize", measure)
    },
    onImageView: () => {
      setOpen(false)
      // 索引文案从「9 / 20」变成「10 / 20」时左栏会变宽，翻页后要重新判定；
      // 库在 swap 落定后才回调这里，此时动画已经结束，搬移控件不会被看到
      measure()
    },
    onClose: () => {
      window.removeEventListener("resize", measure)
      setOpen(false)
      // 菜单里的控件由库在下次 open 时重新创建，这里只断引用
      menu?.remove()
      menu = null
      bar = null
      slot = null
      trigger = null
      placeholders.clear()
      nodes = []
      button = null
      collapsed = false
    },
  }
}
