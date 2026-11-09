import { createIconButton, ICONS } from "../icons"
import { VistaImageHost } from "../imageHost"

import type { VistaGalleryContext, VistaGalleryExtension, VistaTransformState } from "../types"
import type { VistaData, VistaView } from "vistaview"

/** 未操作过的图片默认状态 */
const DEFAULT_STATE: VistaTransformState = { rotate: 0, flipX: false, flipY: false }

/**
 * 角度归一到 0 / 90 / 180 / 270
 * @param angle 任意角度
 */
const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360

/**
 * 旋转与镜像扩展
 *
 * 库的变换模型固定为 `transform: { x, y, scale }`，并在 `onTransformChange` 中整体重写
 * `element.style.transform`，因此不能把 rotate 拼进 transform（会被覆盖）。
 * 这里改用 CSS 独立变换属性 `rotate` / `scale`：它们与 `transform` 是叠加关系，
 * 库写 transform 时不会影响这两个属性，两者可以共存。
 * 代价是旋转角度不参与库的补间动画，旋转与缩放的包围盒计算也会有偏差，
 * 所以旋转前会先把缩放归位。
 * @param context 扩展上下文
 */
export const createRotateExtensions = (context: VistaGalleryContext): VistaGalleryExtension[] => {
  let view: VistaView | null = null

  const applyTransform = (target: VistaView, attempt = 0) => {
    const box = target.state.children.images.find((image) => image.pos === 0)
    if (!box) return

    // 图片解码前尺寸为 0，测不出缩放比例，等就绪后再应用
    if (!box.isReady) {
      if (attempt < 120) requestAnimationFrame(() => applyTransform(target, attempt + 1))
      return
    }

    const state = context.transformStates.get(context.getIndex()) ?? DEFAULT_STATE
    const element = box.element as HTMLElement

    // 旋转后包围盒会变化，先归位缩放，避免库基于旋转后的包围盒计算平移
    if (box instanceof VistaImageHost) box.snapToFit()

    element.style.rotate = `${state.rotate}deg`

    // 先按未缩放状态测量旋转后的包围盒，再把 90 / 270 度的图片缩回视口内
    element.style.scale = "1 1"
    const rect = element.getBoundingClientRect()
    const fit = Math.min(1, window.innerWidth / Math.max(rect.width, 1), window.innerHeight / Math.max(rect.height, 1))
    element.style.scale = `${(state.flipX ? -1 : 1) * fit} ${(state.flipY ? -1 : 1) * fit}`
  }

  const updateState = (updater: (state: VistaTransformState) => VistaTransformState) => {
    const index = context.getIndex()
    const current = context.transformStates.get(index) ?? DEFAULT_STATE
    context.transformStates.set(index, updater(current))
    if (view) applyTransform(view)
  }

  /**
   * 打开画廊：清掉上一轮残留的旋转 / 镜像
   *
   * 打开时库不会走 onImageView，map 里若还留着状态，就会出现「显示是原图、状态却记住翻了」的错位
   * @param vistaView 画廊实例
   */
  const handleOpen = (vistaView: VistaView) => {
    view = vistaView
    context.transformStates.clear()
  }

  /**
   * 切图回调：先清掉「刚离开的那张」的旋转 / 镜像，再应用新图的
   *
   * 状态只保留当前这张：翻转是看图时的临时操作，切走之后再回来应当是原图。
   * 不清的话，上一张的翻转会一直挂在 map 里，下次回到同一索引时又被重新贴上去
   * @param data 本次切换的上下文，index.from 为离开的索引（首次打开时为 null）
   * @param vistaView 画廊实例
   */
  const handleImageView = (data: VistaData, vistaView: VistaView) => {
    view = vistaView
    const { from, to } = data.index
    if (typeof from === "number" && from !== to) context.transformStates.delete(from)
    applyTransform(vistaView)
  }

  const createButton = (
    name: string,
    label: string,
    icon: string,
    updater: (state: VistaTransformState) => VistaTransformState
  ): VistaGalleryExtension => ({
    name,
    description: label,
    control: () => {
      const button = createIconButton(icon, label)
      button.addEventListener("click", (event) => {
        event.stopPropagation()
        updateState(updater)
      })
      return button
    },
    onOpen: handleOpen,
    onImageView: handleImageView,
    onClose: () => {
      view = null
    },
  })

  return [
    createButton("rotateLeft", "左旋转", ICONS.rotateLeft, (state) => ({
      ...state,
      rotate: normalizeAngle(state.rotate - 90),
    })),
    createButton("rotateRight", "右旋转", ICONS.rotateRight, (state) => ({
      ...state,
      rotate: normalizeAngle(state.rotate + 90),
    })),
    createButton("flipHorizontal", "水平翻转", ICONS.flipHorizontal, (state) => ({
      ...state,
      flipX: !state.flipX,
    })),
    createButton("flipVertical", "垂直翻转", ICONS.flipVertical, (state) => ({
      ...state,
      flipY: !state.flipY,
    })),
  ]
}
