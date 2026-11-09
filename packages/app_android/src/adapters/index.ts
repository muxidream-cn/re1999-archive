import { configureFileSaver } from "@app/core/adapters/fileSaver"
import { configureSpider } from "@app/core/adapters/spider"
import { configureUpdater } from "@app/core/adapters/updater"
import { configureUtils } from "@app/core/adapters/utils"
import { configureApiClient } from "@app/core/apis/client"

import { createAndroidFileSaver } from "@/adapters/fileSaver"
import { createAndroidHttpClient } from "@/adapters/http"
import { spiderConfig } from "@/adapters/spider"
import { androidUpdater } from "@/adapters/updater"
import { createAndroidUtils } from "@/adapters/utils"

/** 应用启动前初始化各项配置 */
export const bootstrap = () => {
  // 配置 API 客户端
  configureApiClient(createAndroidHttpClient(import.meta.env.VITE_APP_BASE_API))
  configureFileSaver(createAndroidFileSaver())
  configureUtils(createAndroidUtils())
  // 配置平台更新适配器，供共享 UpdateDialog 与设置页手动检查共用
  configureUpdater(androidUpdater)
  // 配置首页蜘蛛，按端提供缩放与定位
  configureSpider(spiderConfig)
}
