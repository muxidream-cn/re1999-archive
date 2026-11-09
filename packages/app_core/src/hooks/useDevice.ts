import { useBreakpoints, breakpointsTailwind } from "@vueuse/core"
const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""

/** 设备类型判断相关的hook */
export default function () {
  // 在浏览器环境才创建 breakpoints，获取 Tailwind 的断点配置
  const breakpoints = typeof window !== "undefined" ? useBreakpoints(breakpointsTailwind) : null

  const isMobile = computed(() => {
    const byUA = /Android|iPhone|iPad|iPod/i.test(ua)
    const byWidth = breakpoints?.smaller("md").value ?? false
    return byUA || byWidth
  })

  const isDesktop = computed(() => !isMobile.value)
  const isWeb = computed(() => import.meta.env.VITE_APP_DEVICE === "web")
  const isTauri = computed(() => import.meta.env.VITE_APP_DEVICE !== "web")

  return { isMobile, isDesktop, isWeb, isTauri }
}
