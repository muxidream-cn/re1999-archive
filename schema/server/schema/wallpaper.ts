import z from "zod"

import { WallpaperModeEnum, WallpaperQueryTypeEnum, WallpaperRandomQueryEnum, WallpaperSortEnum } from "../router/wallpaper"

import { IdSchema, OrderBySchema, TagsSchema, UpdateTimeSchema, VersionSchema, formatArraySchema } from "./base"

/**壁纸类型验证*/
export const WallpaperSortSchema = z.coerce.number().pipe(z.enum(WallpaperSortEnum))

/**查询壁纸信息的验证*/
export const WallpaperQueryTypeSchema = z.enum(WallpaperQueryTypeEnum).default(WallpaperQueryTypeEnum.all)

/** 数据库壁纸信息验证 */
export const WallpaperDBSchema = z.object({
  /** 壁纸id */
  id: IdSchema,
  /** 壁纸名字 */
  name: z.string().min(1).max(100),
  /** 壁纸原始名字 */
  old_name: z.string().min(1).max(255),
  /** 壁纸别名 */
  nick_name: z.string().min(1).max(20).optional(),
  /** 壁纸官方地址 */
  img_url: z.string().min(1).max(255),
  /** 壁纸所属版本数值 */
  version: VersionSchema,
  /** 壁纸标签 */
  tags: TagsSchema.optional(),
  /** 壁纸所属版本序号 */
  index: z.coerce.number().int().min(1, "序号不能小于1"),
  /** 壁纸类型 */
  sort: WallpaperSortSchema,
  /** 壁纸宽度 */
  width: z.coerce.number().int().min(1, "宽度不能小于1"),
  /** 壁纸高度 */
  height: z.coerce.number().int().min(1, "高度不能小于1"),
  /** 官方以影像之的更新时间 */
  time: z.coerce.number().int().min(20201231, "必须是八位数字日期格式").max(20501231, "必须是八位数字日期格式"),
  /** 壁纸图片路径 */
  img_path: z.string().min(1).max(50),
  /** 壁纸 md5 值 */
  md5: z.string().min(1).max(32),
  /** 创建时间 */
  created_time: z.coerce.date(),
  /** 更新时间 */
  updated_time: z.coerce.date(),
})

/** 查询单个壁纸信息的参数验证 */
export const WallpaperInfoGetSchema = z.object({
  /** 壁纸id */
  id: IdSchema,
})

/** 查询壁纸列表的参数验证 */
export const WallpaperListGetSchema = z.object({
  /** 查询类型 */
  type: z.string().toLowerCase().pipe(z.enum(WallpaperQueryTypeEnum)).default(WallpaperQueryTypeEnum.all),
  /** 壁纸类型*/
  sort: WallpaperSortSchema.optional(),
  /** 版本号数组 */
  version: formatArraySchema(VersionSchema).optional(),
  /** 角色id数组 */
  roles: formatArraySchema(z.coerce.number().int()).optional(),
  /** 角色的查询模式 */
  mode: z.string().toLowerCase().pipe(z.enum(WallpaperModeEnum)).default(WallpaperModeEnum.inaccurate),
  /** 排序方式 */
  orderBy: OrderBySchema,
  /** 每页数量 */
  pageSize: z.coerce.number().int().min(1).optional(),
  /** 偏移量(从0开始) */
  offset: z.coerce.number().int().min(0).optional(),
})

/** 检索壁纸的参数验证 */
export const WallpaperSearchSchema = z.object({
  /** 查询类型 */
  type: z.string().toLowerCase().pipe(z.enum(WallpaperQueryTypeEnum)).default(WallpaperQueryTypeEnum.all),
  /** 壁纸类型*/
  sort: WallpaperSortSchema.optional(),
  /** 版本号数组 */
  version: formatArraySchema(VersionSchema).optional(),
  /** 角色id数组 */
  roles: formatArraySchema(z.coerce.number().int()).optional(),
  /** 角色的查询模式 */
  mode: z.string().toLowerCase().pipe(z.enum(WallpaperModeEnum)).default(WallpaperModeEnum.inaccurate),
  /** 排序方式 */
  orderBy: OrderBySchema,
  /** 每页数量 */
  pageSize: z.coerce.number().int().min(1).optional(),
  /** 偏移量(从0开始) */
  offset: z.coerce.number().int().min(0).optional(),
})

/** 检索壁纸的参数验证 */
export const WallpaperRandomQuerySchema = z.object({
  /** 返回类型 */
  type: z.string().toLowerCase().pipe(z.enum(WallpaperRandomQueryEnum)).default(WallpaperRandomQueryEnum.url),
  /** 壁纸类型 */
  sort: WallpaperSortSchema.optional(),
  /** 限制数量 */
  limit: z.coerce.number().int().min(1).default(1),
})

/** 数据库壁纸信息:insert验证 */
export const WallpaperInsertSchema = WallpaperDBSchema.omit({
  id: true,
  created_time: true,
  updated_time: true,
}).partial({
  nick_name: true,
  tags: true,
})

/** 壁纸信息:update验证 */
export const WallpaperUpdateSchema = WallpaperDBSchema.omit({
  created_time: true,
  updated_time: true,
  // status: true,
})
  .partial()
  .extend({
    id: IdSchema,
  })

/**壁纸信息缓存验证 */
export const WallpaperCacheSchema = WallpaperDBSchema.omit({
  created_time: true,
  updated_time: true,
})

/**壁纸的所有信息(type=all)*/
export const WallpaperAllItemSchema = WallpaperDBSchema.omit({
  created_time: true,
  updated_time: true,
})
