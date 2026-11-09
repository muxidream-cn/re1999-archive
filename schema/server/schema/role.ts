import z from "zod"

import { RoleQueryFieldTypeEnum, RoleQueryTypeEnum, RoleStatusEnum } from "../router/role"

import { IdSchema, TagsSchema } from "./base"

/**角色状态验证*/
export const RoleStatusSchema = z.coerce.number().pipe(z.enum(RoleStatusEnum))

/**查询角色信息的验证*/
export const RoleQueryTypeSchema = z.enum(RoleQueryTypeEnum).default(RoleQueryTypeEnum.all)

/**查询角色信息的字段验证*/
export const RoleQueryFieldTypeSchema = z.enum(RoleQueryFieldTypeEnum).default(RoleQueryFieldTypeEnum.diff)

/** 数据库角色信息验证 */
export const RoleDBSchema = z.object({
  /** 角色id */
  id: IdSchema,
  /** 角色名字 */
  name: z.string().min(1).max(50),
  /** 角色所属阵营 */
  camp: z.string().min(1).max(50),
  /** 角色种族 */
  race: z.string().min(1).max(30),
  /** 角色标签 */
  tags: TagsSchema,
  /** 角色状态 */
  status: RoleStatusSchema,
  /** 创建时间 */
  created_time: z.coerce.date(),
  /** 更新时间 */
  updated_time: z.coerce.date(),
})

/** 查询单个角色信息的参数验证 */
export const RoleInfoGetSchema = z.object({
  /** 角色id */
  id: IdSchema,
})

/** 查询角色列表的参数验证 */
export const RoleListGetSchema = z.object({
  /** 查询类型 */
  type: RoleQueryTypeSchema,
  /** 字段类型 */
  field_type: RoleQueryFieldTypeSchema,
})

/** 数据库角色信息:insert验证 */
export const RoleInsertSchema = RoleDBSchema.omit({
  id: true,
  status: true,
  created_time: true,
  updated_time: true,
})

/** 角色信息:update验证 */
export const RoleUpdateSchema = RoleDBSchema.omit({
  created_time: true,
  updated_time: true,
  // status: true,
})
  .partial()
  .extend({
    id: IdSchema,
  })

/** 角色状态:switch验证 */
export const RoleSwitchStatusSchema = RoleDBSchema.pick({
  id: true,
  status: true,
})

/**角色信息缓存验证 */
export const RoleCacheSchema = RoleDBSchema.omit({
  created_time: true,
  updated_time: true,
})

/**角色的所有信息(type=all)*/
export const RoleAllItemSchema = RoleDBSchema.omit({
  created_time: true,
  updated_time: true,
})
