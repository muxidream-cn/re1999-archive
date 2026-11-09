import { storeToRefs } from "pinia"

import { api_download_home_info } from "@app/core/apis/page"
import { api_search_keyword, api_search_wallpaper } from "@app/core/apis/wallpaper"
import { WallpaperSearchRequest } from "@app/core/apis/wallpaper/type"
import { useRoleStore } from "@app/core/stores/useRoleStore"
import { useVersionStore } from "@app/core/stores/useVersionStore"
import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"
import { errorMsg } from "@app/core/utils/system"

/** 壁纸信息相关的hook */
export default function () {
  const wallpaperStore = useWallpaperStore()
  const roleStore = useRoleStore()
  const versionStore = useVersionStore()

  const { panelInfo } = storeToRefs(wallpaperStore)
  const { roleDiffList } = storeToRefs(roleStore)
  const { versionDiffList } = storeToRefs(versionStore)

  /** 壁纸信息页初始化 */
  const init = async () => {
    try {
      const res = await api_download_home_info()
      const { code, msg, data } = res
      if (code !== 200) throw new Error(msg)
      if (data) {
        panelInfo.value = data.panel_info
        roleDiffList.value = data.role_list
        versionDiffList.value = data.version_list
        return
      }
      throw new Error("下载页面初始化失败")
    } catch (e) {
      errorMsg(e)
    }
  }

  /**检索壁纸 */
  const search = async (params: WallpaperSearchRequest) => {
    try {
      if (!params) throw new Error("查询条件不能为空")
      const res = await api_search_wallpaper(params)
      const { code, msg, data } = res
      if (code !== 200) throw new Error(msg)
      if (data) return data
      throw new Error("未找到符合条件的壁纸信息")
    } catch (e) {
      errorMsg(e)
    }
  }

  /**
   * 根据关键词检索角色和版本信息
   * @param keyword 检索关键字
   * - 检索范围：角色 name 和 tags
   * - 检索范围：版本 name 和 group_name
   * @param mode 查询类型，默认为 "inaccurate"
   * - "inaccurate": 关键词之间是或关系，任意一个关键词匹配即可
   * - "accurate": 关键词之间是与关系，所有关键词都必须匹配
   * @returns 角色信息
   */
  const searchByKeyword = async (keyword: string, mode: "accurate" | "inaccurate") => {
    try {
      const res = await api_search_keyword({ keywords: keyword, mode })
      const { code, msg, data } = res
      if (code !== 200) throw new Error(msg)
      if (data) return data
      throw new Error("未找到符合条件的角色或版本信息")
    } catch (e) {
      errorMsg(e)
    }
  }

  return { init, search, searchByKeyword }
}
