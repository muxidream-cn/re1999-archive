/**过滤后的扁平化路由*/
export interface FlatRoute {
  name?: string | number | symbol
  path: string
  meta?: {
    title?: string
    hide?: boolean
    [key: string]: any
  }
}

/** 页面的路由 */
export const RouteOptions = {
  Main: {
    name: "wallpaper",
    path: "wallpaper",
    wsName: "Home1Page",
    wsPath: "/Home1Page",
  },
  System: {
    name: "",
    path: "",
    wsName: "System",
    wsPath: "/System",
  },
} as const

/** WS 请求的页面名称（后端请求参数） */
export type WSRouteWsName = (typeof RouteOptions)[keyof typeof RouteOptions]["wsName"]
/** WS 请求的页面地址 */
export type WSRouteWsPath = (typeof RouteOptions)[keyof typeof RouteOptions]["wsPath"]
