import { type RouteRecordRaw } from "vue-router"

import { RouteOptions } from "@app/core/types/route"
import { flattenRoutesWithoutRedirect } from "@app/core/utils/route"
import Main from "@app/core/views/downloader/Index.vue"
import Settings from "@app/core/views/settings/Index.vue"

/** 应用路由表：三端共用，跨端差异只体现在 history 模式上 */
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: {
      name: "home",
    },
  },
  {
    path: "/wallpaper",
    meta: {
      title: "壁纸",
      label: "壁纸",
      wsPath: RouteOptions.Main.wsPath,
      // hide: true,
      keepAlive: true,
    },
    children: [
      {
        name: "home", //首页1
        path: "home",
        component: Main,
        meta: {
          title: "检索&下载",
          label: "主页",
          wsPath: RouteOptions.Main.wsPath,
          // hide: true,
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/settings",
    meta: {
      title: "设置",
      label: "设置",
      keepAlive: true,
    },
    children: [
      {
        name: "settings", //设置页
        path: "",
        component: Settings,
        meta: {
          title: "设置",
          label: "设置",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*", // 捕获所有未匹配的路由
    redirect: { name: "home" }, // 直接用 name 重定向
  },
]

/**扁平化路由参数，包含name、path、meta等信息*/
export const customRouteArr = flattenRoutesWithoutRedirect(routes)
