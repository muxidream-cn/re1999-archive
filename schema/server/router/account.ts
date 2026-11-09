import z from "zod"

import {
  AccountQuerySchema,
  AccountVerifySchema,
  AdminAccountInfoQuerySchema,
  AdminAccountListQuerySchema,
  AdminAccountSchema,
  AdminDBSchema,
  AdminLevelSchema,
  AdminUpdateSchema,
  AdminUpdateUserInfoSchema,
  LoginSchema,
  SuperAdminUpdateAdminInfoSchema,
  UserAccountSchema,
  UserDBSchema,
  UserDelAccSchema,
  UserLevelSchema,
  UserUpdateSchema,
} from "../schema/account"

/** 用户等级枚举 */
export const UserLevelEnum = {
  /** 普通用户 */
  normal: 0,
  /** VIP用户 */
  vip: 1,
} as const

/** 管理员等级枚举 */
export const AdminLevelEnum = {
  /** 普通管理员 */
  normal: 0,
  /** 超级管理员 */
  super: 1,
  /**权限冻结 */
  frozen: 2,
} as const

/** 用户等级类型 */
export type UserLevel = z.infer<typeof UserLevelSchema>

/** 管理员等级类型 */
export type AdminLevel = z.infer<typeof AdminLevelSchema>

/** 用户/管理员登录信息类型 */
export type LoginType = z.infer<typeof LoginSchema>

/** 数据库用户信息类型 */
export type UserDB = z.infer<typeof UserDBSchema>

/** 数据库管理员信息类型 */
export type AdminDB = z.infer<typeof AdminDBSchema>

/**账号信息查询类型*/
export type AccountQueryType = z.infer<typeof AccountQuerySchema>

/**账号密码验证查询类型*/
export type AccountVerifyType = z.infer<typeof AccountVerifySchema>

/** 用户账户Token/Cache信息类型 */
export type UserAccountType = z.infer<typeof UserAccountSchema>

/** 管理员账户Token/Cache信息类型 */
export type AdminAccountType = z.infer<typeof AdminAccountSchema>

// /** 用户信息:update普通信息类型 */
// export type UserUpdateNormalType = z.infer<typeof UserUpdateNormalSchema>

// /** 管理员信息:update普通信息类型 */
// export type AdminUpdateNormalType = z.infer<typeof AdminUpdateNormalSchema>

// /** 用户信息:update账户信息类型 */
// export type UserUpdateSecurityType = z.infer<typeof UserUpdateNormalSchema>

// /** 管理员信息:update账户信息类型 */
// export type AdminUpdateSecurityType = z.infer<typeof AdminUpdateSecuritySchema>

/** 用户信息:update所有信息类型 */
export type UserUpdateType = z.infer<typeof UserUpdateSchema>

/** 管理员信息:update所有信息类型 */
export type AdminUpdateType = z.infer<typeof AdminUpdateSchema>

/** 用户注销的验证信息类型 */
export type UserDelAccType = z.infer<typeof UserDelAccSchema>

/** (超级)管理员查询(管理员)账号信息列表类型 */
export type AdminAccountListQueryType = z.infer<typeof AdminAccountListQuerySchema>

/** (超级)管理员查询某(管理员)账号信息类型 */
export type AdminAccountInfoQueryType = z.infer<typeof AdminAccountInfoQuerySchema>

/** 管理员修改某用户信息类型 */
export type AdminUpdateUserInfoType = z.infer<typeof AdminUpdateUserInfoSchema>

/** 超级管理员修改某管理员信息类型 */
export type SuperAdminUpdateAdminInfoType = z.infer<typeof SuperAdminUpdateAdminInfoSchema>
