import z from "zod"

import {
  VersionAllItemSchema,
  VersionCacheSchema,
  VersionDBSchema,
  VersionInsertSchema,
  VersionQueryTypeSchema,
  VersionStatusSchema,
  VersionUpdateSchema,
} from "../schema/version"

/**查询版本信息的枚举*/
export const VersionQueryTypeEnum = {
  /**获取版本的所有信息*/
  all: "all",
  /**仅获取版本id和标题*/
  diff: "diff",
} as const

/**版本状态枚举*/
export const VersionStatusEnum = {
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

/**版本状态类型类型*/
export type VersionStatusType = z.infer<typeof VersionStatusSchema>

/**查询版本信息的类型*/
export type VersionQueryTypeType = z.infer<typeof VersionQueryTypeSchema>

/** 数据库版本信息类型 */
export type VersionDBType = z.infer<typeof VersionDBSchema>

/** 数据库版本信息:insert验证 */
export type VersionInsertType = z.infer<typeof VersionInsertSchema>

/** 数据库版本信息:update验证 */
export type VersionUpdateType = Omit<z.infer<typeof VersionUpdateSchema>, "id">

/**版本信息缓存类型 */
export type VersionCacheType = z.infer<typeof VersionCacheSchema>

/**版本的所有信息类型(type=all)*/
export type VersionAllItemType = z.infer<typeof VersionAllItemSchema>

/**版本的部分信息类型(type=diff)*/
export type VersionDiffItemType = Pick<VersionAllItemType, "name" | "group_name" | "version">
