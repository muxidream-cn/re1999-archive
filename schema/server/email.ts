import z from "zod"

import {
  AdminCodeSchema,
  AdminPwdCodeSchema,
  EmailCodeVerifySchema,
  EmailDBSchema,
  GuestCodeSchema,
  UserCodeSchema,
  UserPwdCodeSchema,
} from "./schema/email"

// todo 邮箱验证码配置

/** 邮箱验证码缓存类型 */
export type EmailCodeCache = {
  /** 验证码 */
  code: string
  /** 验证码错误次数 */
  time: number
}

/** [游客]邮箱验证码类型 */
export const GuestCodeEnum = {
  /** 注册验证码 */
  register: "guest:register",
} as const

/** [用户]邮箱验证码类型 */
export const UserCodeEnum = {
  /** 登录 */
  login: "user:login",
  /** 修改邮箱 */
  updateEmail: "user:updateEmail",
  /** 修改密码 */
  updatePwd: "user:updatePwd",
  /** 重置密码 */
  resetPwd: "user:resetPwd",
  /** 注销 */
  delAcc: "user:delAcc",
} as const

/** [管理员]邮箱验证码枚举 */
export const AdminCodeEnum = {
  /** 登录 */
  login: "admin:login",
  /** 修改邮箱 */
  updateEmail: "admin:updateEmail",
  /** 修改密码 */
  updatePwd: "admin:updatePwd",
  /** 重置密码 */
  resetPwd: "admin:resetPwd",
} as const

/** [游客]邮箱验证码类型 */
export type GuestCodeType = z.infer<typeof GuestCodeSchema>

/** [用户]邮箱验证码类型 */
export type UserCodeType = z.infer<typeof UserCodeSchema>

/** [管理员]邮箱验证码类型 */
export type AdminCodeType = z.infer<typeof AdminCodeSchema>

/** [用户]修改密码/重置密码邮箱验证码类型 */
export type UserPwdCodeType = z.infer<typeof UserPwdCodeSchema>

/** [管理员]修改密码/重置密码邮箱验证码类型 */
export type AdminPwdCodeType = z.infer<typeof AdminPwdCodeSchema>

/** 全部邮箱验证码缓存类型 */
export type CodeType = GuestCodeType | UserCodeType | AdminCodeType

/** 需要邮箱验证码接口的验证类型 */
export type EmailCodeVerifyType = z.infer<typeof EmailCodeVerifySchema>

//#region 数据库邮件验证信息

export type EmailDBType = z.infer<typeof EmailDBSchema>

//#endregion
