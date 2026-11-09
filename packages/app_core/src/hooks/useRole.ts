import { RoleQueryTypeEnum, RoleQueryFieldTypeEnum } from "@serverSchema/router/role"
import { storeToRefs } from "pinia"
import { computed } from "vue"

import { api_get_role_info } from "@app/core/apis/role"
import { useRoleStore } from "@app/core/stores/useRoleStore"
import { errorMsg } from "@app/core/utils/system"

/** 角色信息相关的hook */
export default function () {
  const roleStore = useRoleStore()

  const { roleDiffList } = storeToRefs(roleStore)

  const getRoleList = async (type: keyof typeof RoleQueryTypeEnum, field_type: keyof typeof RoleQueryFieldTypeEnum) => {
    try {
      const res = await api_get_role_info({ type, field_type })
      const { code, msg, data } = res
      if (code !== 200) throw new Error(msg)
      if (data?.role_list?.length) {
        roleDiffList.value = data.role_list
        return data.role_list
      }
      throw new Error("未找到符合条件的角色信息")
    } catch (e) {
      errorMsg(e, "角色信息获取失败")
      return []
    }
  }

  /**
   * 角色 id → 角色名 的映射
   *
   * `roleDiffList` 是 Pinia 里的深层响应式数组，每读一个字段都要过一层 Proxy 并收集依赖。
   * 原实现每次查询都要 map 一遍整个角色列表再 filter，单次约 0.5ms；
   * 瀑布流卡片一多、重渲染一多，这里就是渲染路径上最大的单点开销（实测占比超过一半）。
   * 改成一次性建表后，单次查询降到 O(role_ids.length)，且只在角色数据整体替换时才重建。
   */
  const roleNameMap = computed(() => {
    const map = new Map<number, string>()
    for (const item of roleDiffList.value) map.set(item.id, item.name)
    return map
  })

  /**
   * 根据角色id数组获取角色名字数组
   * @param roleIds 角色 id 列表
   */
  const getRoleNameListByIds = (roleIds: number[]) => {
    const roleNameList: string[] = []
    if (!roleIds?.length) return roleNameList

    const map = roleNameMap.value
    for (const id of roleIds) {
      const name = map.get(id)
      if (name !== undefined) roleNameList.push(name)
    }

    return roleNameList
  }

  return { getRoleList, getRoleNameListByIds }
}
