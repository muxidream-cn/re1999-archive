import z from "zod"

import { QueryModeEnum } from "../router/base"

/** ID验证(正整数) */
export const IdSchema = z.coerce.number().int().positive()

/** 账号邮箱验证(长度5-100) */
export const EmailSchema = z.email().min(5).max(100)

/** 邮箱验证码的验证(长度6-10) */
export const EmailCodeSchema = z.string().min(6).max(10)

/** 积分分值(非负数) */
export const ScoreSchema = z.coerce.number().nonnegative()

/** (数据库)版本号(正整数) */
export const VersionDBSchema = z.coerce.number().int().positive()

/** (查询)版本号(非负整数，默认为0) */
export const VersionQuerySchema = z.coerce.number().int().nonnegative().default(0)

/** 查询类型 */
export const QueryModeSchema = z.enum(QueryModeEnum)

/** 分页查询验证 */
export const PageQuerySchema = z.object({
  /** 每页数量 */
  pageSize: z.coerce.number().int("每页数量必须是整数").positive("每页数量必须大于0").default(25),
  /** 页码(从1开始) */
  page: z.coerce.number().int("页码必须是整数").positive("页码必须大于0").default(1),
})

/** 版本数值 */
export const VersionSchema = z.coerce
  .string()
  .regex(/^\d+(\.\d)?$/, "格式错误，请输入最多一位小数的数字")
  .transform((val) => Number(val))
  .pipe(z.number().min(10, "数值不能小于10"))

/** 标签类型 */
export const TagsSchema = z
  .string()
  .max(255)
  .regex(/^$|^[^,]+(,[^,]+)*$/, "格式错误，请用英文逗号分隔，不能以逗号开头或结尾，不能连续逗号")

/** 官方以影像之的更新时间 */
export const UpdateTimeSchema = z.string().regex(/^\d{8}(,\d{8})*$/, "格式错误，请输入八位数字日期格式，多个用英文逗号分隔")

/**
 * 预处理 Array 型参数(如果是单个值，则转换为数组)
 * @param schema 验证规则
 */
export const formatArraySchema = <T>(schema: z.ZodType<T>) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined
    // 处理params带参是字符串的情况
    if (typeof value === "string") return value.split(",")
    return Array.isArray(value) ? value : [value]
  }, z.array(schema))

/** 排序方式，默认为升序ASC */
export const OrderBySchema = z
  .string()
  .toUpperCase()
  .pipe(z.enum(["DESC", "ASC"]))
  .default("ASC")
