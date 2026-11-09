import { storeToRefs } from "pinia"

import { useSettingsStore } from "@app/core/stores/useSettingsStore"
import { SETTINGS, SETTING_KEYS, type SettingItem, type SettingKey, type SettingValue } from "@app/core/views/settings/schema"

/** 旧主题 store 的持久化 key：store 已移除，这里只为一次性数据迁移保留 */
const LEGACY_THEME_STORE_KEY = "ThemeStore"

/** 迁移只在一个进程内执行一次 */
let legacyThemeMigrated = false

/**
 * 一次性把旧 ThemeStore 的 themeMode / backgroundImage 迁移进设置项
 * - 仅在旧数据存在、且新设置项尚未写入时迁移，不覆盖用户当前值
 * - 迁移后删除旧存储，避免重复执行
 */
const migrateLegacyThemeStore = () => {
  if (legacyThemeMigrated) return
  legacyThemeMigrated = true
  try {
    const raw = localStorage.getItem(LEGACY_THEME_STORE_KEY)
    if (!raw) return
    const legacy = JSON.parse(raw) as { themeMode?: string; backgroundImage?: string | null }
    const settings = useSettings()
    const settingsStore = useSettingsStore()
    if (legacy.themeMode && !("general.theme" in settingsStore.values)) settings.setValue("general.theme", legacy.themeMode)
    if (legacy.backgroundImage !== undefined && !("general.backgroundImage" in settingsStore.values)) {
      settings.setValue("general.backgroundImage", legacy.backgroundImage ?? null)
    }
    localStorage.removeItem(LEGACY_THEME_STORE_KEY)
  } catch (error) {
    console.warn("旧主题设置迁移失败，已跳过", error)
  }
}

/** 设置项读写相关的hook */
export default function useSettings() {
  const settingsStore = useSettingsStore()

  const { values, sessionValues } = storeToRefs(settingsStore)

  /**
   * 按 Schema 的 storage 选择读写的桶
   * @param key 设置项唯一键
   */
  const bucketOf = (key: SettingKey) => (SETTINGS[key].storage === "session" ? sessionValues : values)

  /**
   * 读取设置值，未写入过时返回 Schema 的 default
   * @param key 设置项唯一键
   */
  const getValue = <K extends SettingKey>(key: K): SettingValue<K> => {
    const bucket = bucketOf(key).value
    const item: SettingItem = SETTINGS[key]
    return (key in bucket ? bucket[key] : item.default) as SettingValue<K>
  }

  /**
   * 写入设置值：先按 Schema 裁剪脏值，再写入对应桶，最后执行运行时副作用
   * @param key 设置项唯一键
   * @param value 设置值
   */
  const setValue = <K extends SettingKey>(key: K, value: SettingValue<K>) => {
    const item: SettingItem = SETTINGS[key]
    const next = item.normalize ? item.normalize(value) : value
    bucketOf(key).value[key] = next
    void item.applyValue?.(next)
  }

  /** 清空全部设置（含会话级），之后读取都会回落到 Schema 的 default */
  const reset = () => {
    values.value = {}
    sessionValues.value = {}
  }

  /**
   * 把标记了 `applyOnStartup` 的设置项应用一遍
   * - 同步写 DOM，供首屏恢复 CSS 变量，避免闪烁
   * - 主题与背景图不在此列：它们由侧边栏统一的 applyTheme 编排点驱动
   */
  const applyStartupSettings = () => {
    // 旧 ThemeStore 的数据先搬到设置项，再统一应用，避免主题与背景图重置
    migrateLegacyThemeStore()
    for (const key of SETTING_KEYS) {
      const item: SettingItem = SETTINGS[key]
      if (item.applyOnStartup) void item.applyValue?.(getValue(key))
    }
  }

  return { values, sessionValues, getValue, setValue, reset, applyStartupSettings }
}

/**
 * 是否允许启动时自动检查更新，未设置过时默认开启。
 * 只有显式存了 false 才关闭，避免历史值或异常值把更新静默禁用。
 */
export const shouldCheckUpdateOnStartup = () => useSettings().getValue("update.autoCheck")

/**
 * 是否可以执行启动自动检查：开关开启且本会话尚未检查过。
 * 只做判断不置位——真正发起检查时再调 `markAutoChecked()`，
 * 否则在延迟窗口内刷新会把本会话永久跳过。
 */
export const canAutoCheckThisSession = () => {
  const settings = useSettings()
  return settings.getValue("update.autoCheck") && !settings.getValue("update.autoCheckOnce")
}

/** 标记本会话已自动检查过更新（会话级，关闭应用后失效） */
export const markAutoChecked = () => useSettings().setValue("update.autoCheckOnce", true)
