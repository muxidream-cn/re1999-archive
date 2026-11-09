import { defineStore } from "pinia"

import { Order, OrderType, WallpaperMode, WallpaperModeType, WallpaperSort, WallpaperSortType } from "@app/core/types/wallpaper"

export const select = () => {
  /** 是否显示高级搜索 */
  const isAdvanced = ref(false)
  /** 选中的角色 */
  const roleSelect = ref<Array<SelectOptionType<string>>>([])
  /** 角色选项 */
  const roleOptions = ref<Array<SelectOptionType<string>>>([])

  /** 选中的版本 */
  const versionSelect = ref<Array<SelectOptionType<string>>>([])
  /** 版本选项 */
  const versionOptions = ref<Array<SelectGroupOptionType>>([])

  /** 选中的排序模式 */
  const orderToggle = ref<OrderType>(Order.asc)
  const orderOptions = ref<Array<SelectOptionType<string>>>([
    { value: Order.asc, label: "升序" },
    { value: Order.desc, label: "降序" },
  ])

  /** 选中的分类模式 */
  const sortToggle = ref<WallpaperSortType>(WallpaperSort.all)
  const sortOptions = ref<Array<SelectOptionType<number>>>([
    { value: WallpaperSort.pc, label: "横屏" },
    { value: WallpaperSort.phone, label: "竖屏" },
    { value: WallpaperSort.all, label: "不限" },
  ])

  /** 选中的查询模式 */
  const modeToggle = ref<WallpaperModeType>(WallpaperMode.inaccurate)
  const modeOptions = ref<Array<SelectOptionType<string>>>([
    { value: WallpaperMode.accurate, label: "精确" },
    { value: WallpaperMode.inaccurate, label: "模糊" },
  ])

  watch(
    roleSelect,
    (newVal) => {
      if (Array.isArray(newVal)) {
        const sorted = [...newVal].sort((a, b) => Number(a.value) - Number(b.value))

        // 仅当排序结果与原数组不一致时，才触发更新，防止死循环
        if (JSON.stringify(sorted) !== JSON.stringify(newVal)) {
          roleSelect.value = sorted
        }
      }
    },
    { deep: true }
  )

  watch(
    versionSelect,
    (newVal) => {
      if (Array.isArray(newVal)) {
        const sorted = [...newVal].sort((a, b) => {
          // 将字符串转换为数字后进行比较，实现数值排序
          return Number(a.value) - Number(b.value)
        })

        // 仅当排序结果与原数组不一致时，才触发更新，防止死循环
        if (JSON.stringify(sorted) !== JSON.stringify(newVal)) {
          versionSelect.value = sorted
        }
      }
    },
    { deep: true }
  )

  return {
    isAdvanced,
    roleSelect,
    roleOptions,
    versionSelect,
    versionOptions,
    orderToggle,
    orderOptions,
    sortToggle,
    sortOptions,
    modeToggle,
    modeOptions,
  }
}

/** 壁纸查询筛选项相关的Store，存储筛选项和已选项 */
export const useSelectStore = defineStore("SelectStore", select, {
  persist: [
    {
      pick: ["roleSelect", "versionSelect", "orderToggle", "sortToggle", "modeToggle"],
      storage: sessionStorage,
    },
  ],
})
