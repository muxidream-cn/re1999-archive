import { OrderByEnum } from "@serverSchema/router/base"
import { WallpaperModeEnum, WallpaperSortEnum } from "@serverSchema/router/wallpaper"

export const Order = {
  /** 升序 */
  asc: "ASC",
  /** 降序 */
  desc: "DESC",
} as const

export type OrderType = (typeof Order)[keyof typeof Order]

export const WallpaperSort = { ...WallpaperSortEnum, all: 2 } as const

export type WallpaperSortType = (typeof WallpaperSort)[keyof typeof WallpaperSort]

export const WallpaperMode = WallpaperModeEnum

export type WallpaperModeType = (typeof WallpaperModeEnum)[keyof typeof WallpaperModeEnum]
