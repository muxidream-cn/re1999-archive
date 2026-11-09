import type { Wallpaper_list } from "@app/core/apis/wallpaper/type"
import type { VistaExtension, VistaImgConfig } from "vistaview"

/**
 * 画廊图片配置
 *
 * 在库只认识的 src / alt / srcSet 之外补上缩略图与原始尺寸：
 * 1. thumb：邻图只加载它（不拉原图），当前图在解码前用它占位；
 * 2. width / height：主图解码前无法得知 naturalWidth/Height，靠列表已有的原始像素尺寸
 *    才能立刻算出占位层的适配尺寸，不必等任何请求。
 * 库只读 src / alt / srcSet，多余字段不参与解析，也不会报错。
 */
export type VistaGalleryImgConfig = VistaImgConfig & {
  /** 缩略图地址，与卡片预览图、底部缩略图带同源 */
  thumb?: string
  /** 原始宽度（像素），缺失时退化为等缩略图解码后按自然尺寸校正 */
  width?: number
  /** 原始高度（像素） */
  height?: number
}

/**
 * 画廊扩展类型
 * 在库的扩展接口上追加 sync，用于让 Vue 侧在响应式状态变化时主动刷新控件外观
 */
export type VistaGalleryExtension = VistaExtension & {
  /** 外部状态（如下载中、全屏状态）变化时刷新控件 */
  sync?: () => void
}

/** 单张图片的旋转与镜像状态 */
export type VistaTransformState = {
  /** 顺时针旋转角度，取值 0 / 90 / 180 / 270 */
  rotate: number
  /** 水平镜像 */
  flipX: boolean
  /** 垂直镜像 */
  flipY: boolean
}

/**
 * 扩展工厂共享上下文
 * 扩展内部只拿原生 DOM 与纯函数，不直接依赖 Vue 响应式
 */
export type VistaGalleryContext = {
  /** 当前壁纸列表，全画廊唯一数据源 */
  getList: () => Wallpaper_list[]
  /** 当前查看到的索引 */
  getIndex: () => number
  /** 是否正在下载 */
  isDownloading: () => boolean
  /** 角色名说明文字 */
  getCaption: (index: number) => string
  /** 缩略图地址 */
  getThumb: (index: number) => string
  /** 按索引触发下载 */
  download: (index: number) => void
  /** 当前这张图的旋转/镜像状态：打开时清空，切走时清掉刚离开的那张 */
  transformStates: Map<number, VistaTransformState>
}
