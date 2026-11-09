import type { FlatRoute } from "@app/core/types/route"
import type { RouteRecordRaw } from "vue-router"

/**
 * 扁平化嵌套路由，生成完整 path
 * - 移除 component、children 和 redirect 字段,用于Aside菜单组件使用。
 * - 过滤：meta 信息中含有 hide=true 的单个路由或 hideAll=true 的父子路由，以及没有component的路由
 * @param routes 原始嵌套路由数组
 * @returns 扁平化后的路由数组（不含 redirect）
 */
export function flattenRoutesWithoutRedirect(routes: RouteRecordRaw[]): FlatRoute[] {
  const flatRoutes: FlatRoute[] = []

  /**
   * 递归处理路由
   * @param route 原始嵌套路由
   * @param parentPath 父路由路径
   */
  function processRoute(route: RouteRecordRaw, parentPath = ""): void {
    const fullPath = route.path.startsWith("/") ? route.path : `${parentPath}/${route.path}`.replace(/\/+/g, "/")

    // === [1] 跳过整个路由树 ===
    if (route.meta?.hideAll) return

    const hasComponent = !!route.component
    const hasNameOrTitle = !!route.name || !!route.meta?.title
    const hide = route.meta?.hide === true

    // === [2] 是否输出父路由 ===
    const shouldOutputParent = !route.redirect && !hide && (hasComponent || hasNameOrTitle)

    if (shouldOutputParent) {
      const { children, component, redirect, ...rest } = route
      flatRoutes.push({
        ...rest,
        path: fullPath,
      })
    }

    // === [3] 子路由处理 ===
    if (route.children && route.children.length > 0) {
      route.children.forEach((child) => {
        if (child.redirect || child.meta?.hide || child.meta?.hideAll) return
        const { component, children, redirect, ...rest } = child
        flatRoutes.push({
          ...rest,
          path: `${fullPath}/${child.path}`.replace(/\/+/g, "/"),
        })
      })
    }
  }

  routes.forEach((route) => processRoute(route))

  return flatRoutes
}
