import momo from "@app/core/apis"
import { wallpaper } from "@app/core/apis/path"

import {
  KeyWordSearchRequest,
  KeyWordSearchResponse,
  WallpaperRandomRequest,
  WallpaperRandomResponse,
  WallpaperSearchRequest,
  WallpaperSearchResponse,
} from "./type"

/**获取随机壁纸 */
const api_get_random_wallpaper = async (params: WallpaperRandomRequest) => momo.get<WallpaperRandomResponse>(wallpaper.random, params)

/**搜索壁纸 */
const api_search_wallpaper = async (params: WallpaperSearchRequest) => momo.get<WallpaperSearchResponse>(wallpaper.search, params)

/**根据关键词检索角色和版本信息 */
const api_search_keyword = async (params: KeyWordSearchRequest) => momo.get<KeyWordSearchResponse>(wallpaper.searchByKeyword, params)

export { api_get_random_wallpaper, api_search_wallpaper, api_search_keyword }
