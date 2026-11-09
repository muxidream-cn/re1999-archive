import z from "zod"

import { VersionQueryTypeEnum, VersionStatusEnum } from "../router/version"

import { IdSchema, UpdateTimeSchema, VersionSchema } from "./base"

/**版本状态验证*/
export const VersionStatusSchema = z.coerce.number().pipe(z.enum(VersionStatusEnum))

/**查询版本信息的验证*/
export const VersionQueryTypeSchema = z.enum(VersionQueryTypeEnum).default(VersionQueryTypeEnum.all)

/** 数据库版本信息验证 */
export const VersionDBSchema = z.object({
  /** 版本id */
  id: IdSchema,
  /** 版本名字 */
  name: z.string().min(1).max(50),
  /** 版本系列名 */
  group_name: z.string().min(1).max(50),
  /** 版本数值 */
  version: VersionSchema,
  /** 官方以影像之的更新时间 */
  time: UpdateTimeSchema,
  /** 版本状态 */
  status: VersionStatusSchema,
  /** 创建时间 */
  created_time: z.coerce.date(),
  /** 更新时间 */
  updated_time: z.coerce.date(),
})

/** 查询单个版本信息的参数验证 */
export const VersionInfoGetSchema = z.object({
  /** 版本id */
  id: IdSchema,
})

/** 查询版本列表的参数验证 */
export const VersionListGetSchema = z.object({
  /** 查询类型 */
  type: VersionQueryTypeSchema,
})

/** 数据库版本信息:insert验证 */
export const VersionInsertSchema = VersionDBSchema.omit({
  id: true,
  status: true,
  created_time: true,
  updated_time: true,
})

/** 版本信息:update验证 */
export const VersionUpdateSchema = VersionDBSchema.omit({
  created_time: true,
  updated_time: true,
  // status: true,
})
  .partial()
  .extend({
    id: IdSchema,
  })

/** 版本状态:switch验证 */
export const VersionSwitchStatusSchema = VersionDBSchema.pick({
  id: true,
  status: true,
})

/**版本信息缓存验证 */
export const VersionCacheSchema = VersionDBSchema.omit({
  created_time: true,
  updated_time: true,
})

/**版本的所有信息(type=all)*/
export const VersionAllItemSchema = VersionDBSchema.omit({
  created_time: true,
  updated_time: true,
})
