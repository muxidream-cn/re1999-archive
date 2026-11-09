import z from "zod"

import { AdminCodeEnum, GuestCodeEnum, UserCodeEnum } from "../email"
import { EmailCodeSchema, EmailSchema, IdSchema } from "./base"

/** 游客邮箱验证码的验证 */
export const GuestCodeSchema = z.enum(GuestCodeEnum)

/** 游客邮箱验证码类型的验证 */
export const UserCodeSchema = z.enum(UserCodeEnum)

/** 管理员邮箱验证码类型的验证 */
export const AdminCodeSchema = z.enum(AdminCodeEnum)

/** 所有邮箱验证码类型的验证 */
export const AllCodeSchema = z.union([GuestCodeSchema, UserCodeSchema, AdminCodeSchema])

/** 用户修改/重置密码邮箱验证码类型的验证 */
export const UserPwdCodeSchema = z.enum([UserCodeEnum.updatePwd, UserCodeEnum.resetPwd])

/** 管理员修改/重置密码邮箱验证码类型的验证 */
export const AdminPwdCodeSchema = z.enum([AdminCodeEnum.updatePwd, AdminCodeEnum.resetPwd])

/** 请求邮箱验证码接口的验证 */
export const EmailCodeQuerySchema = z.object({
  /** 邮箱 */
  email: EmailSchema,
  /** 所有验证码类型 */
  codeType: AllCodeSchema,
})

/** 需要邮箱验证码接口的验证 */
export const EmailCodeVerifySchema = EmailCodeQuerySchema.extend({
  /** 验证码 */
  code: EmailCodeSchema,
})

//#region 数据库邮件验证信息

/** 数据库邮件验证记录的信息验证 */
export const EmailDBSchema = z.object({
  /** 邮件验证记录id */
  id: IdSchema,
  /** 邮箱 */
  email: EmailSchema,
  /** 验证码 */
  code: EmailCodeSchema,
  /** 验证码类型 */
  type: z.string().max(200),
  /** 验证失败次数 */
  time: z.number(),
  /** 创建时间 */
  created_time: z.coerce.date(),
})

//#endregion
