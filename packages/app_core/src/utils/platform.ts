import { openUrl } from "@app/core/adapters/utils"

/** 官网地址 */
export const OFFICIAL_WEBSITE_URL = "https://download.muxidream.cn"

/**
 * 打开官网
 * - 通过 openUrl 适配器按端选择打开方式（Web 用 window.open，Tauri 用 plugin-opener）
 */
export const openWebsite = () => {
  openUrl(OFFICIAL_WEBSITE_URL)
}
