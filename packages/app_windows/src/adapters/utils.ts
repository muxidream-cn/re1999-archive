import { Utils } from "@app/core/adapters/utils/type"
import { openUrl } from "@tauri-apps/plugin-opener"

export const createWindowsUtils = (): Utils => ({
  openUrl: (url) => openUrl(url),
})
