import z from "zod"

import {
  RoleAllItemSchema,
  RoleCacheSchema,
  RoleDBSchema,
  RoleInsertSchema,
  RoleListGetSchema,
  RoleQueryFieldTypeSchema,
  RoleQueryTypeSchema,
  RoleStatusSchema,
  RoleUpdateSchema,
} from "../schema/role"

/**查询角色信息的枚举*/
export const RoleQueryTypeEnum = {
  /**获取所有角色的信息*/
  all: "all",
  /**仅获取含有壁纸的角色的信息*/
  diff: "diff",
} as const

/**查询角色信息的字段枚举*/
export const RoleQueryFieldTypeEnum = {
  /**获取角色的所有信息*/
  all: "all",
  /**获取角色的部分信息*/
  diff: "diff",
} as const

/**角色状态枚举*/
export const RoleStatusEnum = {
  /** 被删除 */
  deleted: 0,
  /** 可修改可删除 */
  editableAndDeletable: 1,
  /** 可修改不可删除 */
  editableOnly: 2,
  /** 不可修改可删除 */
  deletableOnly: 3,
  /** 不可修改不可删除 */
  locked: 4,
} as const

/**角色状态类型类型*/
export type RoleStatusType = z.infer<typeof RoleStatusSchema>

/**查询角色信息的类型*/
export type RoleQueryTypeType = z.infer<typeof RoleQueryTypeSchema>

/**查询角色信息的字段类型*/
export type RoleQueryFieldTypeType = z.infer<typeof RoleQueryFieldTypeSchema>

/** 查询角色列表的参数验证 */
export type RoleListGetType = z.infer<typeof RoleListGetSchema>

/** 数据库角色信息类型 */
export type RoleDBType = z.infer<typeof RoleDBSchema>

/** 数据库角色信息:insert验证 */
export type RoleInsertType = z.infer<typeof RoleInsertSchema>

/** 数据库角色信息:update验证 */
export type RoleUpdateType = Omit<z.infer<typeof RoleUpdateSchema>, "id">

/**角色信息缓存类型 */
export type RoleCacheType = z.infer<typeof RoleCacheSchema>

/**角色的所有信息类型(type=all)*/
export type RoleAllItemType = z.infer<typeof RoleAllItemSchema>

/**角色的部分信息类型(type=diff)*/
export type RoleDiffItemType = Pick<RoleAllItemType, "id" | "name" | "race" | "camp" | "tags">
