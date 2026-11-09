import { transition as libraryTransition, type VistaTransitionFn } from "vistaview"

/** 向前翻页的目标位移：容器左移一屏，右侧的下一张滑入；与库默认值保持一字不差 */
const FORWARD_TRANSFORM = "translateX(-100vw)"
/** 向后翻页的目标位移：容器右移一屏，左侧的上一张滑入 */
const BACKWARD_TRANSFORM = "translateX(100vw)"

/**
 * 翻页转场：在库默认实现之上按翻页方向纠正位移方向
 *
 * 库只拿 index.from/to 的差值推方向（vistaview: defaults/transition.js:32-35），
 * 而画廊正好 2 张图时 0→1 与 1→0 这一对索引同时命中它两个「向前」分支
 * （`to === from+1` 与 `from === L-1 && to === 0`），next 与 prev 被算成同一个值，
 * 表现为「上一张」恒定朝着「下一张」的方向滑动。
 * 三张以上时中间页 `to = from-1` 不命中任何分支、首尾回绕 `|to-from| = L-1` 可区分，所以只有 2 张图出错。
 * 库在 next()/prev() 里本来就写明了方向（vista-view.js:508 / 516，经 swap() 注入 vistaData.via），
 * 这里直接采信它；via 全为 false 的调用（缩略图带 view(index) 跳转）不干预，保留库的索引推算结果。
 *
 * 返回后覆写样式是安全的：默认实现把写样式放在 new Promise 的 executor 里，executor 同步执行，
 * 所以 libraryTransition() 返回时 transform 已落进 style；同一任务内再赋一次值只有最终值参与样式计算，
 * 过渡依旧从当前值跑到新目标，transitionend 正常触发，swap() 的 await 不会挂起。
 * 只改 transform，不碰 transition，动画时长与缓动仍由 animationDurationBase 决定。
 * @param params 本次翻页的上下文，含 from/to 索引与 via 方向标记
 * @param signal 库用于中断本次过渡的取消信号
 * @param vistaView 画廊实例
 */
export const galleryTransition: VistaTransitionFn = (params, signal, vistaView) => {
  const result = libraryTransition(params, signal, vistaView)
  // undefined 表示本次不播动画（无目标节点 / 已中断 / 减少动效 / 非相邻），此时不能写样式
  if (!result) return result

  const container = vistaView.imageContainer
  if (!container) return result

  let target: string | null = null
  if (params.via.next) target = FORWARD_TRANSFORM
  else if (params.via.prev) target = BACKWARD_TRANSFORM

  if (target && container.style.transform !== target) container.style.transform = target

  return result
}
