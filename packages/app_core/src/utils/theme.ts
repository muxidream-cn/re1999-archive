import { ThemeMode } from "@app/core/types/system"

/** 组件透明度允许的最小值 */
export const MIN_COMPONENT_OPACITY = 0.3

/** 容器颜色默认值 */
export const DEFAULT_CONTAINER_COLOR = "#ffffff"

/**
 * 把 themeMode 解析成「当前是否应用深色」，纯函数，不产生副作用。
 * auto 跟随系统偏好；light / dark 按显式模式判断。
 * @param mode 当前主题模式
 * @param prefersDark 系统是否偏好深色
 */
export const resolveDark = (mode: keyof typeof ThemeMode, prefersDark: boolean): boolean =>
  mode === ThemeMode.auto ? prefersDark : mode === ThemeMode.dark

/**
 * 组件透明度写入全局 --alpha，由 CSS 里的 rgba(var(--bg-r), var(--bg-g), var(--bg-b), var(--alpha)) 消费
 * @param value 0.3~1 的透明度
 */
export const applyComponentOpacity = (value: number) => {
  const opacity = Math.min(1, Math.max(MIN_COMPONENT_OPACITY, Number(value)))
  if (Number.isNaN(opacity)) return
  document.documentElement.style.setProperty("--alpha", String(opacity))
}

/**
 * 容器背景色拆成 --bg-r / --bg-g / --bg-b 三个通道写入全局 CSS 变量
 * @param raw #RRGGBB 颜色；非法值直接忽略，避免把 CSS 变量写成 undefined
 */
export const applyContainerColor = (raw: string) => {
  const channels = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/.exec(raw ?? "")
  if (!channels) return
  const rootStyle = document.documentElement.style
  rootStyle.setProperty("--bg-r", String(parseInt(channels[1], 16)))
  rootStyle.setProperty("--bg-g", String(parseInt(channels[2], 16)))
  rootStyle.setProperty("--bg-b", String(parseInt(channels[3], 16)))
}

/**
 * 写入 <html> 的深色 class 与 colorScheme
 * - dark class 同时是 useSystem 判定「当前是否浅色」的真值来源，必须先写
 * - colorScheme 让原生控件 / 滚动条跟随解析后的主题，而不是 OS 偏好
 * @param dark 是否应用深色
 */
export const applyDarkClass = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}
