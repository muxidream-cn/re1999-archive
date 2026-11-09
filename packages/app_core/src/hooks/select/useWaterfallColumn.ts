import { storeToRefs } from "pinia"

import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"

/** 壁纸瀑布流展示列数相关的hook */
export default function () {
  const wallpaperStore = useWallpaperStore()
  const { searchResult, waterFallSetting, currentColumnCount } = storeToRefs(wallpaperStore)

  const setFixedColumnCount = (columnCount: number) => {
    waterFallSetting.value.itemMinWidth = 0
    waterFallSetting.value.maxColumnCount = columnCount
    waterFallSetting.value.minColumnCount = columnCount
    currentColumnCount.value = columnCount
  }

  const reduceColumnCount = () => {
    const nextColumnCount = currentColumnCount.value - 1
    if (nextColumnCount < 1) return
    setFixedColumnCount(nextColumnCount)
  }

  const addColumnCount = () => {
    const nextColumnCount = currentColumnCount.value + 1
    if (nextColumnCount > searchResult.value.length) return
    setFixedColumnCount(nextColumnCount)
  }

  const resetColumnCount = () => {
    waterFallSetting.value.maxColumnCount = 6
    waterFallSetting.value.minColumnCount = 1
    waterFallSetting.value.itemMinWidth = 220
  }

  return {
    waterFallSetting,
    currentColumnCount,
    reduceColumnCount,
    addColumnCount,
    resetColumnCount,
  }
}
