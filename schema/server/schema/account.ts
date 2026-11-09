import z from "zod"

import { AdminCodeEnum, UserCodeEnum } from "../email"
import { AdminLevelEnum, UserLevelEnum } from "../router/account"
import { QueryModeEnum } from "../router/base"

import { EmailCodeSchema, EmailSchema, IdSchema, PageQuerySchema, QueryModeSchema } from "./base"

/** 用户等级验证 */
export const UserLevelSchema = z.coerce.number().pipe(z.enum(UserLevelEnum))

/** 管理员等级验证 */
export const AdminLevelSchema = z.coerce.number().pipe(z.enum(AdminLevelEnum))

/** 账号用户名验证 */
export const UsernameSchema = z
  .string()
  .min(2, "请输入2-10位中文、字母、或数字的昵称！")
  .max(10, "请输入2-10位中文、字母、或数字的昵称！")
  .regex(/^[\u4E00-\u9FA5a-zA-Z0-9]+$/, "请输入2-10位中文、字母、或数字的昵称！")

/** 账号输入密码验证 */
export const InputPasswordSchema = z
  .string()
  .min(6, "请输入6-18位不含特殊字符的密码！")
  .max(18, "请输入6-18位不含特殊字符的密码！")
  .regex(/^[A-Za-z\d\-&.,()\s]+$/, "请输入6-18位不含特殊字符的密码！")

/** 管理员标志验证 */
export const IsAdminSchema = z.coerce.boolean().default(false)

/** 注册输入信息验证 */
export const RegisterSchema = z.object({
  /** 邮箱 */
  email: EmailSchema,
  /** 用户名 */
  username: UsernameSchema,
  /** (输入的)密码 */
  password: InputPasswordSchema,
})

/** 重置密码输入信息验证 */
export const ResetPasswordSchema = z.object({
  /** 邮箱 */
  email: EmailSchema.optional(),
  /** 用户名 */
  username: UsernameSchema.optional(),
  /** (输入的)密码 */
  password: InputPasswordSchema,
  /** 是否是管理员 */
  codeType: z.enum([UserCodeEnum.resetPwd, AdminCodeEnum.resetPwd]).default(UserCodeEnum.resetPwd),
})

/** 登录输入信息验证 */
export const LoginSchema = z
  .object({
    /** 邮箱 */
    email: EmailSchema,
    /** 用户名 */
    username: UsernameSchema,
    /** (输入的)密码 */
    password: InputPasswordSchema,
    /** 邮箱验证码 */
    code: EmailCodeSchema,
    /** 是否是管理员 */
    codeType: z.enum([UserCodeEnum.login, AdminCodeEnum.login]).default(UserCodeEnum.login),
  })
  .partial()

/** 用户账号信息验证 */
export const UserDBSchema = z.object({
  /** 账号uid */
  uid: IdSchema,
  /** 账号邮箱 */
  email: EmailSchema,
  /** 账号名 */
  username: UsernameSchema,
  /** 账号头像序号 */
  headImgIndex: z.coerce.number().int().nonnegative(),
  /** (数据库的加密)密码 */
  password: z.string().min(6).max(100),
  /** 账号等级 */
  level: UserLevelSchema,
  /** 账号头像图片id */
  headImgId: z.coerce.number().int().nonnegative().nullish(),
  /** 账号背景图片id */
  bgId: z.coerce.number().int().nonnegative().nullish(),
  /** 账号个性签名 */
  signature: z.string().max(160).nullish(),
  /** 创建时间 */
  created_time: z.coerce.date(),
  /** 更新时间 */
  updated_time: z.coerce.date(),
})

/** 管理员账号信息验证 */
export const AdminDBSchema = UserDBSchema.pick({
  uid: true,
  email: true,
  username: true,
  password: true,
  headImgIndex: true,
  headImgId: true,
  created_time: true,
  updated_time: true,
}).extend({
  /** 管理员等级 */
  level: AdminLevelSchema,
})

/**账号信息查询验证*/
export const AccountQuerySchema = UserDBSchema.pick({
  uid: true,
  email: true,
  username: true,
}).partial()

/**账号密码验证查询验证*/
export const AccountVerifySchema = AccountQuerySchema.extend({
  /** (输入的)密码 */
  password: InputPasswordSchema,
})

/** 用户信息:Token/Cache信息验证 */
export const UserAccountSchema = UserDBSchema.pick({
  uid: true,
  email: true,
  username: true,
  headImgIndex: true,
  level: true,
}).extend({
  /** 用户参与过的展会版本列表 */
  versions: z.array(z.number()).default([]),
})

/** 管理员信息:Token/Cache普通信息验证 */
export const AdminAccountSchema = AdminDBSchema.pick({
  uid: true,
  email: true,
  username: true,
  headImgIndex: true,
  level: true,
})

/** 用户信息:update普通信息验证 */
export const UserUpdateNormalSchema = UserDBSchema.omit({
  uid: true,
  email: true,
  password: true,
  level: true,
  created_time: true,
  updated_time: true,
}).partial()

/** 管理员信息:update普通信息验证 */
export const AdminUpdateNormalSchema = AdminDBSchema.omit({
  uid: true,
  email: true,
  password: true,
  level: true,
  created_time: true,
  updated_time: true,
}).partial()

/** 用户/管理员信息:update账户信息验证 */
export const AccountUpdateSecuritySchema = z.object({
  /** 邮箱 */
  email: EmailSchema.optional(),
  /** (输入的)密码 */
  password: InputPasswordSchema.optional(),
})

/** 用户信息:update验证 */
export const UserUpdateSchema = UserUpdateNormalSchema.and(AccountUpdateSecuritySchema)

/** 管理员信息:update验证 */
export const AdminUpdateSchema = UserUpdateNormalSchema.and(AccountUpdateSecuritySchema)

/** 用户注销的信息验证 */
export const UserDelAccSchema = UserDBSchema.pick({
  /** (输入的)密码 */
  password: true,
})
  .extend({
    /** 邮箱验证码 */
    code: EmailCodeSchema,
    /** 验证码类型 */
    codeType: z.literal(UserCodeEnum.delAcc).default(UserCodeEnum.delAcc),
  })
  .partial()

/** (超级)管理员查询(管理员)账号信息列表验证 */
export const AdminAccountListQuerySchema = PageQuerySchema.extend({
  type: QueryModeSchema.default(QueryModeEnum.diff),
})

/** (超级)管理员查询某(管理员)账号信息验证 */
export const AdminAccountInfoQuerySchema = AccountQuerySchema.extend({
  type: QueryModeSchema.default(QueryModeEnum.diff),
})

/** 管理员修改某用户信息验证 */
export const AdminUpdateUserInfoSchema = UserDBSchema.omit({
  uid: true,
  created_time: true,
  updated_time: true,
}).partial()

/** 超级管理员修改某管理员信息验证 */
export const SuperAdminUpdateAdminInfoSchema = AdminDBSchema.omit({
  uid: true,
  created_time: true,
  updated_time: true,
}).partial()
