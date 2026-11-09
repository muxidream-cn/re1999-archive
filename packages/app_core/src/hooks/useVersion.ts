import { VersionQueryTypeEnum } from "@serverSchema/router/version"

import { api_get_version_info } from "@app/core/apis/version"
import { errorMsg } from "@app/core/utils/system"

/** 版本信息相关的hook */
export default function () {
  const getVersionList = async (type: keyof typeof VersionQueryTypeEnum) => {
    try {
      const res = await api_get_version_info({ type })
      const { code, msg, data } = res
      if (code !== 200) throw new Error(msg)
      if (data?.version_list?.length) return data.version_list
      throw new Error("未找到符合条件的版本信息")
    } catch (e) {
      errorMsg(e, "版本信息获取失败")
      return []
    }
  }

  return { getVersionList }
}
