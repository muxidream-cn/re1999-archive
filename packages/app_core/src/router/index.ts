import { createRouter, createWebHistory, type Router, type RouterHistory } from "vue-router"

import useWallpaper from "@app/core/hooks/useWallpaper"

import { routes } from "./routes"

export interface CreateAppRouterOptions {
  /** 路由模式，默认 createWebHistory；各端需要 hash / memory 模式时在此覆盖 */
  history?: RouterHistory
}

/**
 * 创建应用路由实例
 *
 * - 路由表与守卫由 app_core 统一维护，各端只传入差异化配置（如 history 模式）
 * - 与 `useRoute()` / `useRouter()` 的消费方同属 app_core，保证是同一份 vue-router 实例，
 *   避免各端自行 createRouter 时因依赖副本不同导致路由上下文注入失败
 * @param options 各端差异化配置
 */
export function createAppRouter(options: CreateAppRouterOptions = {}): Router {
  const router = createRouter({
    // 路由器工作模式，有 createWebHistory 和 createWebHashHistory 两种，web上线后需要服务器配置，hash地址栏会出现#号
    history: options.history ?? createWebHistory(),
    routes,
  })

  router.beforeEach(async (to, from) => {
    // 首页数据（面板 / 角色 / 版本列表）只在真正进入下载器首页时拉取；
    // 设置页滚动的 ?section= 回写、进入其它页面、首页内部导航都不触发
    if (to.name !== "home" || from.name === "home") return

    try {
      console.warn("[start]路由跳转开始")
      console.log("router:from\n", from, "\nrouter:to\n", to)
      await useWallpaper().init()

      return
    } catch (e) {
      console.error("路由跳转出错：", e)
    } finally {
      console.warn("[end]路由跳转结束")
    }
  })

  return router
}
