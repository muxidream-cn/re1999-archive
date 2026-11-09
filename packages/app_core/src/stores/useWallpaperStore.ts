import { defineStore } from "pinia"

import { WallpaperSearchResponse } from "@app/core/apis/wallpaper/type"

export const wallpaper = () => {
  /** 首页数据面板信息 */
  const panelInfo = ref({
    wallpaper_count: 0,
    version_count: 0,
    role_count: 0,
  })

  /** 壁纸的检索结果 */
  const searchResult = shallowRef<WallpaperSearchResponse["wallpaper_list"]>([])

  /** 瀑布流设定 */
  const waterFallSetting = reactive({
    maxColumnCount: 6,
    minColumnCount: 1,
    padding: 10,
    itemMinWidth: 220,
  })

  /** 瀑布流当前列数 */
  const currentColumnCount = ref(1)

  /** 壁纸是否处于选择中 */
  const isWallpaperSelecting = ref(false)
  /** 壁纸被选择的 ID 数组 */
  const selectedWallpaperIds = ref(new Set<number>())
  /** 壁纸是否处于下载中 */
  const isDownloading = ref(false)

  return {
    panelInfo,
    searchResult,
    waterFallSetting,
    currentColumnCount,
    isWallpaperSelecting,
    selectedWallpaperIds,
    isDownloading,
  }
}

export const useWallpaperStore = defineStore("WallPaperStore", wallpaper)
