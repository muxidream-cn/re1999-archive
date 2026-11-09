import { Utils } from "./type"

let AppUtils: Utils | null = null

export const configureUtils = (utils: Utils) => {
  AppUtils = utils
}

export const hasUtils = () => AppUtils !== null

export const openUrl = (url: string) => {
  if (!AppUtils) {
    throw new Error("App utils has not been configured")
  }

  return AppUtils.openUrl(url)
}

export const setStatusBar = (isLight: boolean) => {
  if (!AppUtils) {
    throw new Error("App utils has not been configured")
  } else if (!AppUtils.setStatusBar) {
    console.warn("函数调用不存在")
    return Promise.resolve(false)
  }

  return AppUtils.setStatusBar(isLight)
}
