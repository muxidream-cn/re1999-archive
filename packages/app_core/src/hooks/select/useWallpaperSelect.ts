import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"

import useImageDownload from "@app/core/hooks/useImageDownload"
import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"

/** 壁纸(下载前)选择相关的hook */
export default function () {
  const wallpaperStore = useWallpaperStore()
  const { searchResult, isWallpaperSelecting, selectedWallpaperIds, isDownloading } = storeToRefs(wallpaperStore)
  const { customDownload } = useImageDownload()

  const selection = {
    start: () => {
      isWallpaperSelecting.value = true
    },
    cancel: () => {
      isWallpaperSelecting.value = false
      selectedWallpaperIds.value.clear()
    },
    isSelected: (id: number) => selectedWallpaperIds.value.has(id),
    selectAll: () => {
      selectedWallpaperIds.value = new Set(searchResult.value.map((item) => item.id))
    },
    invertSelected: () => {
      selectedWallpaperIds.value = new Set(searchResult.value.map((item) => item.id).filter((id) => !selectedWallpaperIds.value.has(id)))
    },
  }

  const toggleSelection = (id: number) => {
    if (selectedWallpaperIds.value.has(id)) selectedWallpaperIds.value.delete(id)
    else selectedWallpaperIds.value.add(id)
  }

  const getSelected = () => {
    const wallpaperById = new Map(searchResult.value.map((item) => [item.id, item]))
    return Array.from(selectedWallpaperIds.value).flatMap((id) => {
      const wallpaper = wallpaperById.get(id)
      return wallpaper ? [wallpaper] : []
    })
  }

  const downloadSelected = async () => {
    if (isDownloading.value) {
      toast.info("正在下载中，请稍后再试")
      return
    }
    const wallpapers = getSelected()
    if (!wallpapers.length) {
      toast.info("请先选择要下载的壁纸")
      return
    }
    isWallpaperSelecting.value = false
    selectedWallpaperIds.value.clear()
    await customDownload(wallpapers.map((item) => ({ name: item.name, url: item.img_url, path: item.img_path })))
  }

  return {
    searchResult,
    isWallpaperSelecting,
    selectedWallpaperIds,
    isDownloading,
    startSelection: selection.start,
    cancelSelection: selection.cancel,
    isSelected: selection.isSelected,
    selectAll: selection.selectAll,
    invertSelected: selection.invertSelected,
    toggleSelection,
    getSelected,
    downloadSelected,
  }
}
