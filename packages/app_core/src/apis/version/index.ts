import momo from "@app/core/apis"
import { Version } from "@app/core/apis/path"

import { VersionInfoItemRequest, VersionInfoItemResponse } from "./type"

/**获取版本列表信息 */
const api_get_version_info = async (params: VersionInfoItemRequest) => momo.get<VersionInfoItemResponse>(Version.info, params)

export { api_get_version_info }
