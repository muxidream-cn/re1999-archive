import { usePreferredDark } from "@vueuse/core"

import useSettings from "@app/core/hooks/useSettings"
import { ThemeMode } from "@app/core/types/system"
import { resolveDark } from "@app/core/utils/theme"

/** 主题与背景图相关的hook */
export default function useTheme() {
  const settings = useSettings()

  /** 系统外观偏好（VueUse 内部用 matchMedia 监听，随系统翻转自动更新） */
  const prefersDark = usePreferredDark()

  /** 日夜模式，持久化在设置项 general.theme 中 */
  const themeMode = computed({
    get: () => settings.getValue("general.theme") as keyof typeof ThemeMode,
    set: (mode: keyof typeof ThemeMode) => settings.setValue("general.theme", mode),
  })

  /**
   * 背景图 URL，三态：
   * - null：从未设置（切浅色时按原逻辑随机取一张并保存）
   * - ""：用户主动清除（切浅色 / 重启都保持无背景）
   * - URL 字符串：已设置（切浅色时直接还原，不再请求随机接口）
   */
  const backgroundImage = computed({
    get: () => settings.getValue("general.backgroundImage"),
    set: (url: string | null) => settings.setValue("general.backgroundImage", url),
  })

  /** 解析后的深浅色：页头按钮与背景同步共用的单一真值来源，不参与持久化 */
  const isDark = computed(() => resolveDark(themeMode.value, prefersDark.value))

  return { themeMode, backgroundImage, isDark, prefersDark }
}
