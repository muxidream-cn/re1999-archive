import { RoleDiffItemType, RoleAllItemType, RoleListGetType } from "@serverSchema/router/role"

export type RoleDiffItem = RoleDiffItemType
export type RoleAllItem = RoleAllItemType
export type RoleInfoItemRequest = RoleListGetType

export type RoleList = Array<RoleDiffItem> | Array<RoleAllItem>

export type RoleInfoItemResponse = {
  role_list: RoleList
}
