import z from "zod"

import {
  WallpaperAllItemSchema,
  WallpaperCacheSchema,
  WallpaperDBSchema,
  WallpaperInsertSchema,
  WallpaperQueryTypeSchema,
  WallpaperRandomQuerySchema,
  WallpaperSearchSchema,
  WallpaperSortSchema,
  WallpaperUpdateSchema,
} from "../schema/wallpaper"

/**查询壁纸信息的枚举*/
export const WallpaperQueryTypeEnum = {
  /**获取壁纸的大部分信息*/
  all: "all",
  /**仅获取壁纸id和标题*/
  diff: "diff",
  /** 管理模式，获取所有信息 */
  management: "management",
} as const

/**获取随机壁纸的枚举*/
export const WallpaperRandomQueryEnum = {
  /** 返回壁纸的url */
  url: "url",
  /** 直接返回壁纸 */
  image: "image",
} as const

/**查询壁纸信息的枚举*/
export const WallpaperModeEnum = {
  /** 精准查询(包含所有角色)*/
  accurate: "accurate",
  /** 模糊查询(包含任一角色)*/
  inaccurate: "inaccurate",
} as const

/**壁纸类型枚举*/
export const WallpaperSortEnum = {
  /** 横屏壁纸 */
  pc: 0,
  /** 竖屏壁纸 */
  phone: 1,
} as const

/**壁纸类型类型*/
export type WallpaperSortEnumType = z.infer<typeof WallpaperSortSchema>

/**查询壁纸信息的类型*/
export type WallpaperQueryTypeType = z.infer<typeof WallpaperQueryTypeSchema>

/**检索壁纸信息的类型*/
export type WallpaperSearchType = z.infer<typeof WallpaperSearchSchema>

/**检索壁纸信息的类型*/
export type WallpaperRandomQueryType = z.infer<typeof WallpaperRandomQuerySchema>

/** 数据库壁纸信息类型 */
export type WallpaperDBType = z.infer<typeof WallpaperDBSchema>

/** 数据库壁纸信息:insert验证 */
export type WallpaperInsertType = z.infer<typeof WallpaperInsertSchema>

/** 数据库壁纸信息:update验证 */
export type WallpaperUpdateType = Omit<z.infer<typeof WallpaperUpdateSchema>, "id">

/**壁纸信息缓存类型 */
export type WallpaperCacheType = z.infer<typeof WallpaperCacheSchema>

/**壁纸的所有信息类型(type=all)*/
export type WallpaperAllItemType = z.infer<typeof WallpaperAllItemSchema>

/**壁纸的部分信息类型(type=diff)*/
export type WallpaperDiffItemType = Pick<WallpaperAllItemType, "id" | "name" | "version" | "img_url" | "img_path" | "width" | "height">
