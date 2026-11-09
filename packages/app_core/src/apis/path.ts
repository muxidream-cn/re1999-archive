/** 程序相关 */
export const App = {
  check: "/app/check",
  /** 获取各平台及架构的最新发布版本 */
  latest: "/app/version/latest",
} as const

/** 版本相关 */
export const Version = {
  info: "/version/info",
  create: "/version/create",
  update: "/version/update",
} as const

/** 角色相关 */
export const Role = {
  info: "/role/info",
  create: "/role/create",
  update: "/role/update",
} as const

/** 壁纸相关 */
export const wallpaper = {
  random: "/wallpaper/random",
  info: "/wallpaper/info",
  list: "/wallpaper/list",
  search: "/wallpaper/search",
  searchByKeyword: "/wallpaper/search-keyword",
} as const

/** 页面相关 */
export const Page = {
  download: "/download/home",
} as const
