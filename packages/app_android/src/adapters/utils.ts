import { Utils } from "@app/core/adapters/utils/type"
import { openUrl } from "@tauri-apps/plugin-opener"
import { setStatusBarLight } from "tauri-plugin-status-bar-api"

/**
 * 设置状态栏文本颜色
 * @param isLight 是否为亮色模式
 * - true 为亮色模式（黑色图标）
 * - false 为暗色模式（白色图标）
 */
const setStatusBar = async (isLight: boolean) => {
  try {
    return await setStatusBarLight(isLight)
  } catch (error) {
    console.error("设置状态栏文本颜色失败:", error)
    return false
  }
}

export const createAndroidUtils = (): Utils => ({
  openUrl: (url) => openUrl(url),
  setStatusBar: (isLight) => setStatusBar(isLight),
})
