import { storeToRefs } from "pinia"

import { useSelectStore } from "@app/core/stores/useSelectStore"
import { Order, OrderType, WallpaperMode, WallpaperModeType, WallpaperSort, WallpaperSortType } from "@app/core/types/wallpaper"

import useRoleSelect from "./useRole"
import useVersionSelect from "./useVersion"

/** 壁纸查询筛选项相关的hook */
export default function () {
  const selectStore = useSelectStore()
  const role = useRoleSelect()
  const version = useVersionSelect()

  const { roleSelect, versionSelect, orderToggle, sortToggle, sortOptions, orderOptions, modeToggle } = storeToRefs(selectStore)

  /**获取选项 */
  const refresh = {
    role: role.refresh,
    version: version.refresh,
  }

  /** 查询某个角色/版本是否被选中并返回该选项 */
  const selected = {
    role: role.selected,
    version: version.selected,
  }

  /** 重置筛选 */
  const reset = {
    role: role.reset,
    version: version.reset,
    order: () => {
      orderToggle.value = Order.asc
    },
    sort: () => {
      sortToggle.value = WallpaperSort.all
    },
    mode: () => {
      modeToggle.value = WallpaperMode.inaccurate
    },
    all: () => {
      reset.role()
      reset.version()
      reset.order()
      reset.sort()
      reset.mode()
    },
  }

  /** 选择或取消选择某版本/角色 */
  const toggle = {
    role: role.toggle,
    version: version.toggle,
  }

  /**移除某个筛选 */
  const remove = {
    role: role.remove,
    version: version.remove,
  }

  /** 所有筛选项 */
  const options = {
    /** 获取所有筛选项 */
    get: () => ({
      version: versionSelect.value,
      role: roleSelect.value,
      sort: sortToggle.value,
      order: orderToggle.value,
      mode: modeToggle.value,
    }),
    /**修改所有筛选项 */
    set: (options?: {
      version?: Array<SelectOptionType<string>>
      role?: Array<SelectOptionType<string>>
      sort: WallpaperSortType
      orderBy?: OrderType
      mode: WallpaperModeType
    }) => {
      if (options?.version) versionSelect.value = options?.version
      if (options?.role) roleSelect.value = options?.role
      sortToggle.value = options?.sort ?? WallpaperSort.all
      if (options?.orderBy) orderToggle.value = options?.orderBy
      if (modeToggle.value && options?.mode) modeToggle.value = options?.mode
      console.log("修改所有筛选项为：", options)
    },
  }

  /** 获取标签名 */
  const getLabel = {
    sort: () => {
      if (typeof sortToggle.value !== "number") return "不限类型"
      return sortOptions.value.find((item) => item.value === sortToggle.value)?.label ?? "未命名的值"
    },
    order: () => orderOptions.value.find((item) => item.value === orderToggle.value)?.label ?? "未命名的值",
  }

  const init = {
    role: role.init,
    version: version.init,
    all: async () => {
      await Promise.all([role.init(), version.init()])
    },
  }

  return { init, refresh, options, getLabel, selected, toggle, remove, reset }
}
