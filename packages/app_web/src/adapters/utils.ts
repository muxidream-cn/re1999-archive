import { Utils } from "@app/core/adapters/utils/type"

export const createWindowsUtils = (): Utils => ({
  openUrl: async (url) => {
    if (window) window.open(url, "_blank")
  },
})
