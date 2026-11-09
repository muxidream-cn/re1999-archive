import { storeToRefs } from "pinia"

import { RoleDiffItem } from "@app/core/apis/role/type"
import useRole from "@app/core/hooks/useRole"
import { useRoleStore } from "@app/core/stores/useRoleStore"
import { useSelectStore } from "@app/core/stores/useSelectStore"
import { RoleGroupType, RoleGroup } from "@app/core/types/role"
import { errorMsg } from "@app/core/utils/system"

/** 角色筛选项相关的hook */
export default function () {
  const roleStore = useRoleStore()
  const selectStore = useSelectStore()

  const { roleDiffList } = storeToRefs(roleStore)
  const { isAdvanced, roleSelect, roleOptions } = storeToRefs(selectStore)

  /** 分组映射 */
  const groupMaps = reactive<Record<RoleGroupType, Map<string, string[]>>>({
    camp: new Map(),
    race: new Map(),
  })

  /**获取角色选项 */
  const refresh = async (list: RoleDiffItem[] = []) => {
    try {
      if (!list.length) {
        list = await useRole().getRoleList("diff", "diff")
        roleDiffList.value = list
      }
      roleOptions.value = roleDiffList.value.map((item) => {
        return { value: item.id.toString(), label: item.name }
      })

      /** 构建所有分组 */
      groupMaps.camp.clear()
      groupMaps.race.clear()

      buildGroupMap(roleDiffList.value, (item) => item.camp).forEach((value, key) => {
        groupMaps.camp.set(key, value)
      })
      buildGroupMap(roleDiffList.value, (item) => item.race).forEach((value, key) => {
        groupMaps.race.set(key, value)
      })
    } catch (error) {
      errorMsg(error)
    }
  }

  /**
   * 构建分组Map
   * @param list 角色列表
   * @param getter 获取分组名称
   */
  const buildGroupMap = (list: RoleDiffItem[], getter: (item: RoleDiffItem) => string | undefined) => {
    const map = new Map<string, string[]>()

    for (const item of list) {
      const groupName = getter(item)
      if (!groupName) continue

      const id = item.id.toString()
      const ids = map.get(groupName)

      if (ids) ids.push(id)
      else map.set(groupName, [id])
    }

    return map
  }

  /**
   * 获取某个分组包含的角色ID
   * @param type 分组类型
   * @param group 分组组名
   */
  const getGroupRoleIds = (type: RoleGroupType, group: string) => {
    return groupMaps[type].get(group) ?? []
  }

  /**
   * 获取分组
   * @param type 分组类型
   */
  const getGroups = (type: RoleGroupType) => {
    return Array.from(groupMaps[type].keys())
  }

  /**
   * 判断某个分组是否全部选中
   * @param type 分组类型
   * @param group 分组组名
   */
  const isGroupSelected = (type: RoleGroupType, group: string) => {
    const ids = getGroupRoleIds(type, group)
    if (!ids.length) return false
    const selectedIds = new Set(roleSelect.value.map((item) => item.value))

    return ids.every((id) => selectedIds.has(id))
  }

  /**
   * 判断某个分组是否部分选中
   * @param type 分组类型
   * @param group 分组组名
   */
  const isGroupIndeterminate = (type: RoleGroupType, group: string) => {
    const ids = getGroupRoleIds(type, group)
    if (!ids.length) return false
    const selectedIds = new Set(roleSelect.value.map((item) => item.value))

    const count = ids.filter((id) => selectedIds.has(id)).length
    return count > 0 && count < ids.length
  }

  const getGroupMap = (type: RoleGroupType) => {
    return type === RoleGroup.camp ? groupMaps.camp : groupMaps.race
  }

  /**
   * 批量选择 / 移除某个 camp / race 下的角色
   * 如果该分组内角色全部已经选中则全部移除，否则全部选中
   * @param type 分组类型
   * @param group 分组组名
   */
  const toggleGroup = (type: RoleGroupType, group: string) => {
    const groupMap = getGroupMap(type)
    const roleIds = groupMap.get(group)

    if (!roleIds?.length) return

    const selectedIds = new Set(roleSelect.value.map((item) => item.value))

    const isAllSelected = roleIds.every((id) => selectedIds.has(id))

    if (isAllSelected) {
      // 全部移除
      roleSelect.value = roleSelect.value.filter((item) => !roleIds.includes(item.value))
    } else {
      // 全部添加
      const selected = new Set(roleSelect.value.map((item) => item.value))

      for (const id of roleIds) {
        if (!selected.has(id)) {
          const option = roleOptions.value.find((item) => item.value === id)

          if (option) {
            roleSelect.value.push(option)
          }
        }
      }
    }
  }

  /**
   * 查询某个角色是否被选中并返回该角色的选项
   * @param id 角色ID
   */
  const selected = (id: number | string) => roleSelect.value.find((item) => item.value === id.toString())

  /**
   * 选择或取消选择某角色
   * @param id 角色ID
   */
  const toggle = (id: number | string) => {
    if (selected(id)) {
      // 已选中，移除
      roleSelect.value = roleSelect.value.filter((item) => item.value !== id.toString())
    } else {
      // 未选中，添加
      const option = roleOptions.value.find((item) => item.value === id.toString())
      if (option) {
        // 存在
        roleSelect.value.push(option)
      } else errorMsg(`该角色[id:${id}]选项不存在或该角色无壁纸`)
    }
  }

  /** 重置角色筛选 */
  const reset = () => {
    roleSelect.value = []
  }

  /**
   * 移除某个角色筛选
   * @param index 选择项索引
   */
  const remove = (index: number) => {
    roleSelect.value.splice(index, 1)
  }

  const init = () => refresh(roleDiffList.value)

  return {
    isAdvanced,
    roleSelect,
    roleOptions,
    init,
    refresh,
    selected,
    toggle,
    remove,
    reset,
    getGroups,
    toggleGroup,
    isGroupSelected,
    isGroupIndeterminate,
  }
}
