import { useEventListener } from "@vueuse/core"

import type { Ref } from "vue"

/**
 * 滚动监听（scrollspy）
 *
 * 监听容器滚动，返回当前视口中最近命中的分区 id，实现"侧边导航高亮跟随内容滚动"。
 * 锚点跳转只滚动传入的容器，不使用 `scrollIntoView`（它会连带滚动所有可滚动祖先，把顶部 header 顶出视口）。
 * @param containerRef 滚动容器 Ref
 * @param ids 分区锚点 id 列表（需与容器内元素的 id 一致）
 * @param offset 判定偏移量（ px ，一般取顶部粘性元素的高度 + 余量）
 */
export default function useScrollSpy(containerRef: Ref<HTMLElement | null>, ids: Ref<string[]>, offset = 24) {
  /** 当前激活的分区 id */
  const activeId = ref<string>("")

  /** 程序化滚动期间的静默截止时间，避免平滑滚动过程中反复改写激活项 */
  let muteRecomputeUntil = 0

  const recompute = () => {
    if (Date.now() < muteRecomputeUntil) return

    const container = containerRef.value
    if (!container) return

    const scrollTop = container.scrollTop
    let current = ""

    for (const id of ids.value) {
      const el = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null
      if (!el) continue
      // 元素顶部相对容器内容的位置（已滚过判定线则记为候选激活项，取最后一个满足条件的）
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
      if (top <= scrollTop + offset) {
        current = id
      }
    }

    // 滚动到底部时强制激活最后一项
    if (scrollTop + container.clientHeight >= container.scrollHeight - 2 && ids.value.length) {
      current = ids.value[ids.value.length - 1]
    }

    activeId.value = current
  }

  /**
   * 滚动到指定分区（只操作内部容器的 scrollTop）
   * @param id 分区锚点 id
   * @param behavior 滚动行为，smooth 或 auto
   */
  const scrollTo = (id: string, behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.value
    if (!container) return

    const el = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null
    if (!el) return

    // 平滑滚动期间暂停自动计算，结束后恢复（多留一点余量给浏览器动画）
    muteRecomputeUntil = behavior === "smooth" ? Date.now() + 700 : 0

    // 元素顶部换算到容器内容坐标系，再减去判定偏移量，使 recompute 恰好命中该分区；
    // 不能用 scrollIntoView：它会滚动所有可滚动祖先（含 overflow:hidden 的 html/body），
    // 导致整页上移、顶部 header 消失，滚动内容后才被滚动链复位
    const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - offset
    container.scrollTo({ top: Math.max(0, top), behavior })
    activeId.value = id
  }

  useEventListener(containerRef, "scroll", recompute, { passive: true })

  onMounted(() => {
    // 首帧布局完成后计算一次激活项，避免异步渲染导致命中为空
    recompute()
    nextTick(recompute)
  })

  watch(ids, () => nextTick(recompute))

  return { activeId, scrollTo, recompute }
}
