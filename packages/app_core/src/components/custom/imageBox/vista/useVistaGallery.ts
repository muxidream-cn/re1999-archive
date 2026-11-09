import { vistaView, type VistaInterface, type VistaOpt } from "vistaview"
import { onUnmounted, watch } from "vue"

import useDevice from "@app/core/hooks/useDevice"

import { createAutoplayExtension } from "./extensions/autoplay"
import { createBottomPanelExtension } from "./extensions/bottomPanel"
import { createDownloadExtension } from "./extensions/download"
import { createFullscreenExtension } from "./extensions/fullscreen"
import { createImageHostExtension } from "./extensions/imageHost"
import { createImageLoadingExtension } from "./extensions/imageLoading"
import { createImmersiveExtension } from "./extensions/immersive"
import { createOverflowMenuExtension, OVERFLOW_MENU_NAME } from "./extensions/overflowMenu"
import { createPagingThrottleExtension } from "./extensions/paging"
import { createResetZoomExtension } from "./extensions/resetZoom"
import { createRotateExtensions } from "./extensions/rotate"
import { galleryTransition } from "./galleryTransition"

import type { VistaGalleryContext, VistaGalleryExtension, VistaGalleryImgConfig, VistaTransformState } from "./types"
import type { Wallpaper_list } from "@app/core/apis/wallpaper/type"

/** 画廊所需的外部依赖，全部由调用方以纯函数/ref 形式注入；移动端判断在内部走 useDevice */
export type UseVistaGalleryOptions = {
  /** 壁纸列表，全画廊唯一数据源 */
  list: Ref<Wallpaper_list[]>
  /** 是否正在下载 */
  isDownloading: Ref<boolean>
  /** 角色名说明文字 */
  getCaption: (item: Wallpaper_list) => string
  /** 缩略图地址 */
  getThumb: (item: Wallpaper_list) => string
  /** 触发下载 */
  download: (item: Wallpaper_list) => void
}

/**
 * 工具栏控件排布
 * 桌面端对齐截图展示完整一组，移动端去掉全屏（WebView 不支持）、补上放大键，并多一个 more 溢出入口
 * @param isMobile 是否移动端
 */
const buildControls = (isMobile: boolean): VistaOpt["controls"] => ({
  // 沉浸入口在两端都靠右：放左侧会和索引挤在一起，视觉上也不成组
  topLeft: ["indexDisplay"],
  // 库对 controls 是浅合并（vista-view.js:43-46），其默认值带 bottomLeft: ['description']，
  // 不显式覆盖会残留库自带的说明控件：它与自研的 .vvg-caption 内容重复，
  // 还会占住底部栏左侧槽位，把底部区域挤成「说明文字 + 缩略图带」的左右布局
  bottomLeft: [],
  // 移动端右栏与桌面端同源，窄屏放不下时由 overflowMenu 扩展把「四个翻转 + 自动播放」
  // 收进 more 菜单，见 extensions/overflowMenu.ts
  topRight: isMobile
    ? [
        "rotateLeft",
        "rotateRight",
        "flipHorizontal",
        "flipVertical",
        "zoomIn",
        "resetZoom",
        "autoplay",
        "download",
        "immersive",
        OVERFLOW_MENU_NAME,
        "close",
      ]
    : [
        "rotateLeft",
        "rotateRight",
        "flipHorizontal",
        "flipVertical",
        "fullscreen",
        "zoomIn",
        "resetZoom",
        "autoplay",
        "download",
        "immersive",
        "close",
      ],
  // 说明文字与缩略图带必须共用一个槽位，否则会被库横向并排
  bottomCenter: ["bottomPanel"],
})

/** 画廊根节点层级 */
const GALLERY_Z_INDEX = 1000

/**
 * VistaView 画廊封装
 * 负责实例的创建/销毁、单数据源投射与扩展装配
 * @param options 外部依赖
 */
export const useVistaGallery = (options: UseVistaGalleryOptions) => {
  // 移动端判断统一走 useDevice：UA 命中或视口窄于 md 都算移动端，
  // 与页面里其它组件用的是同一个来源，避免画廊和列表对「是否移动端」判断不一致
  const { isMobile } = useDevice()

  /** 当前查看期间的旋转/镜像状态，生命周期由 rotate 扩展维护（打开时清空、切走时清掉离开那张） */
  const transformStates = new Map<number, VistaTransformState>()

  let instance: VistaInterface | null = null
  let extensions: VistaGalleryExtension[] = []

  const getItem = (index: number) => options.list.value[index]

  const context: VistaGalleryContext = {
    getList: () => options.list.value,
    getIndex: () => instance?.getCurrentIndex() ?? 0,
    isDownloading: () => options.isDownloading.value,
    getCaption: (index) => {
      const item = getItem(index)
      return item ? options.getCaption(item) : ""
    },
    getThumb: (index) => {
      const item = getItem(index)
      return item ? options.getThumb(item) : ""
    },
    download: (index) => {
      const item = getItem(index)
      if (item) options.download(item)
    },
    transformStates,
  }

  const destroy = () => {
    extensions = []
    // destroy 内部会先无动画关闭，同时摘掉监听，必须调用，否则离开页面会残留 DOM 与全局监听
    instance?.destroy()
    instance = null
  }

  const create = () => {
    destroy()

    const list = options.list.value
    if (!list.length) return

    // 这几个实例要交给溢出菜单保管，先建出来留引用
    const mobile = isMobile.value
    const autoplay = createAutoplayExtension(context)
    const rotate = createRotateExtensions(context)

    extensions = [
      // 必须第一位：库只取第一个提供 onInitializeImage 的扩展
      createImageHostExtension(),
      createDownloadExtension(context),
      createImmersiveExtension(),
      createPagingThrottleExtension(),
      // 纯状态提示：不提供控件、不参与 controls 排布，只监听主图加载进度
      createImageLoadingExtension(),
      autoplay,
      createBottomPanelExtension(context),
      createResetZoomExtension(),
      ...rotate,
      // 移动端隐藏全屏：Tauri 的 Android WebView 不支持 Fullscreen API，按钮点了只会静默无效
      ...(mobile ? [] : [createFullscreenExtension()]),
      // 只有移动端顶栏会溢出；桌面端按钮放得下，不引入 more 入口
      ...(mobile ? [createOverflowMenuExtension({ items: [...rotate, autoplay] })] : []),
    ]

    // 数组模式只投射 src 与 alt，说明文字/缩略图/下载字段全部按索引从 list 现算。
    // thumb 与原始尺寸额外带上：VistaImageHost 用 thumb 让邻图只加载低清图、
    // 用原始尺寸在主图解码前就算出占位层的适配尺寸，见 types.ts 的 VistaGalleryImgConfig
    const elements: VistaGalleryImgConfig[] = list.map((item) => ({
      src: item.img_url,
      alt: options.getCaption(item),
      thumb: options.getThumb(item),
      width: item.width,
      height: item.height,
    }))

    instance = vistaView({
      elements,
      extensions,
      // 移动端判断只在建实例时取一次快照，与 preloads / controls 一起决定，之后由 resize 自行收敛
      controls: buildControls(isMobile.value),
      animationDurationBase: 333,
      // 移动端只预载前后各 1 张，避免一次拉 5 张原图
      preloads: isMobile.value ? 1 : 2,
      maxZoomLevel: 3,
      arrowOnSmallScreens: !isMobile.value,
      initialZIndex: GALLERY_Z_INDEX,
      // 只有 2 张图时库按索引推不出翻页方向，next/prev 会滑向同一侧，这里按 via 纠正
      transitionFunction: galleryTransition,
    })
  }

  /**
   * 打开画廊
   * @param index 目标索引
   */
  const open = (index: number) => {
    const list = options.list.value
    if (!list.length) return

    if (!instance) create()
    if (!instance) return

    instance.open(Math.max(0, Math.min(index, list.length - 1)))
  }

  /** 外部响应式状态变化后同步控件外观 */
  const sync = () => {
    extensions.forEach((extension) => extension.sync?.())
  }

  // 搜索结果整体替换（无分页追加），直接销毁重建实例，规避 reset() 在数组模式只更新数量的语义
  watch(
    () => options.list.value,
    () => create(),
    { flush: "post" }
  )

  onUnmounted(destroy)

  return { open, sync, destroy }
}
