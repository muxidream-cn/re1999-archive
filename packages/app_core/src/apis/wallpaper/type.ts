import { WallpaperRandomQueryType, WallpaperSearchType, WallpaperDiffItemType, WallpaperAllItemType } from "@serverSchema/router/wallpaper"

export type WallpaperRandomRequest = WallpaperRandomQueryType

export type WallpaperRandomResponse = { url_list: string[] }

export type WallpaperSearchRequest = Partial<WallpaperSearchType>

export type WallpaperSearchResponse = {
  wallpaper_list: Array<WallpaperAllItemType & { role_ids: number[] }> | Array<WallpaperDiffItemType & { role_ids: number[] }>
  pageSize?: number
  limit?: number
  total: number
}

export type Wallpaper_list = WallpaperSearchResponse["wallpaper_list"][number]

export type KeyWordSearchRequest = {
  keywords: string
  /** 精准查询(and,包含所有关键词),模糊查询(or,包含任一关键词)*/
  mode: "accurate" | "inaccurate"
}

export type KeyWordSearchResponse = {
  roles: Array<{
    id: number
    name: string
    tags: string
  }>
  versions: Array<{
    version: number
    name: string
    group_name: string
  }>
}
