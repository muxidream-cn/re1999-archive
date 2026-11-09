import momo from "@app/core/apis"
import { Role } from "@app/core/apis/path"

import { RoleInfoItemRequest, RoleInfoItemResponse } from "./type"

import type { ApiResponse } from "@app/core/apis/types"

/**获取版本列表信息 */
const api_get_role_info = async (params: RoleInfoItemRequest) => momo.get<RoleInfoItemResponse>(Role.info, params)

export { api_get_role_info }
