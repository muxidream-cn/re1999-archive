import { configureSpider } from "@app/core/adapters/spider"
import { configureUtils } from "@app/core/adapters/utils"
import { configureApiClient } from "@app/core/apis/client"

import { createWebHttpClient } from "@/adapters/http"
import { spiderConfig } from "@/adapters/spider"
import { createWindowsUtils } from "@/adapters/utils"

/** 应用启动前初始化各项配置 */
export const bootstrap = () => {
  // 配置 API 客户端
  configureApiClient(createWebHttpClient(import.meta.env.VITE_APP_BASE_API))
  configureUtils(createWindowsUtils())
  // 配置首页蜘蛛，按端提供缩放与定位
  configureSpider(spiderConfig)
}
