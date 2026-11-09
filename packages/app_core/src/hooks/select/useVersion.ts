import { storeToRefs } from "pinia"

import { VersionList } from "@app/core/apis/version/type"
import useVersion from "@app/core/hooks/useVersion"
import { useSelectStore } from "@app/core/stores/useSelectStore"
import { useVersionStore } from "@app/core/stores/useVersionStore"
import { errorMsg } from "@app/core/utils/system"

/** 版本筛选项相关的hook */
export default function () {
  const { getVersionList } = useVersion()
  const versionStore = useVersionStore()
  const selectStore = useSelectStore()

  const { versionDiffList } = storeToRefs(versionStore)
  const { versionSelect, versionOptions } = storeToRefs(selectStore)

  /**获取版本选项 */
  const refresh = async (list: VersionList = []) => {
    try {
      if (!list.length) {
        list = await getVersionList("diff")
        versionDiffList.value = list
      }
      const map = new Map<string, Array<{ value: string; label: string }>>()

      for (const item of list) {
        const group = map.get(item.group_name) ?? []
        group.push({ value: item.version.toString(), label: item.name })
        map.set(item.group_name, group)
      }

      versionOptions.value = [...map.entries()].map(([label, group]) => ({
        label,
        group,
      }))
    } catch (error) {
      errorMsg(error)
    }
  }

  /**
   * 查询某个版本是否被选中并返回该版本的选项
   * @param version 版本数值
   */
  const selected = (version: number | string) => versionSelect.value.find((item) => item.value === version.toString())

  /**
   * 选择或取消选择某版本
   * @param version 版本数值
   */
  const toggle = (version: number | string) => {
    if (selected(version)) {
      // 已选中，移除
      versionSelect.value = versionSelect.value.filter((item) => item.value !== version.toString())
    } else {
      // 未选中，添加
      const option = versionDiffList.value.find((item) => item.version === Number(version))
      if (option) {
        // 存在
        versionSelect.value.push({ value: option.version.toString(), label: option.name })
      } else errorMsg(`该版本[version:${version}]选项不存在`)
    }
  }

  /** 重置版本筛选 */
  const reset = () => {
    versionSelect.value = []
  }

  /**移除某个版本筛选 */
  const remove = (index: number) => {
    versionSelect.value.splice(index, 1)
  }

  const init = () => refresh(versionDiffList.value)

  return { versionSelect, versionOptions, init, refresh, selected, toggle, remove, reset }
}
