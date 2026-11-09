import { ThemeMode } from "@app/core/types/system"
import { DEFAULT_CONTAINER_COLOR, MIN_COMPONENT_OPACITY, applyComponentOpacity, applyContainerColor } from "@app/core/utils/theme"

/** 存储位置：local 为长期（localStorage），session 为临时（sessionStorage，会话结束即失效） */
export type SettingStorage = "local" | "session"

/** 生效方式：live 立即生效；reload 需刷新页面；restart 需重启应用 */
export type SettingApplyMode = "live" | "reload" | "restart"

/** 所有设置项的公共元信息 */
type SettingBase = {
  /** 名称 */
  label: string
  /** 说明，仅作文档与悬浮提示，不在设置页字段下方展示 */
  description: string
  storage: SettingStorage
  apply: SettingApplyMode
  /** 启动时是否把持久化值应用一遍（如写 CSS 变量） */
  applyOnStartup?: boolean
  /** 值写入后的运行时副作用；只允许纯 DOM 操作，禁止访问 Pinia，避免与 useSettings 循环依赖 */
  applyValue?: (value: any) => void | Promise<void>
  /** 写入前裁剪 / 纠正脏值（来自 localStorage 的异常数据不能污染 DOM） */
  normalize?: (value: any) => any
}

/** 单个设置项：值类型与默认值由判别联合约束，避免二者不一致 */
export type SettingItem = SettingBase &
  (
    | { valueType: "boolean"; default: boolean }
    | { valueType: "number"; default: number; bounds?: { min?: number; max?: number; step?: number } }
    | { valueType: "string"; default: string; options?: readonly { label: string; value: string }[] }
    | { valueType: "string|null"; default: string | null }
  )

/** 由 Schema 条目推断出值的 TS 类型 */
export type SettingValueOf<T> = T extends { valueType: "boolean" }
  ? boolean
  : T extends { valueType: "number" }
    ? number
    : T extends { valueType: "string|null" }
      ? string | null
      : string

const THEME_OPTIONS = [
  { label: "日间模式", value: ThemeMode.light },
  { label: "夜间模式", value: ThemeMode.dark },
  { label: "跟随系统", value: ThemeMode.auto },
] as const

const LANGUAGE_OPTIONS = [
  { label: "简体中文", value: "zh-CN" },
  { label: "English", value: "en-US" },
] as const

const SIMPLE_MENU_OPTIONS = [
  { label: "全部显示", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
] as const

/**
 * 主题模式仅接受三个枚举值，脏值回落到夜间模式
 * @param value 待校验的主题模式
 */
const normalizeTheme = (value: string): string =>
  value === ThemeMode.light || value === ThemeMode.dark || value === ThemeMode.auto ? value : ThemeMode.dark

/**
 * 设置项 Schema：全项目唯一真值源
 *
 * - key 即对象键，统一在这里定义，拼错 key 会在编译期报错
 * - `description` 只作说明，不在设置页渲染
 * - `applyValue` 必须是纯 DOM 操作（Schema 不依赖 Pinia）
 */
export const SETTINGS = {
  "general.theme": {
    label: "主题模式",
    description: "跟随系统会随系统外观设置自动切换",
    valueType: "string",
    default: ThemeMode.dark,
    options: THEME_OPTIONS,
    storage: "local",
    apply: "live",
    normalize: (value: string) => normalizeTheme(value),
  },
  "general.backgroundImage": {
    label: "背景图",
    description: "空值(null)表示从未设置，浅色模式下会随机取一张；空字符串表示用户主动清除；字符串为已设置的图片地址",
    valueType: "string|null",
    default: null,
    storage: "local",
    apply: "live",
  },
  "general.componentOpacity": {
    label: "组件透明度",
    description: "浅色模式下调整卡片、侧边栏与弹层的背景不透明度",
    valueType: "number",
    default: 1,
    bounds: { min: MIN_COMPONENT_OPACITY, max: 1, step: 0.01 },
    storage: "local",
    apply: "live",
    applyOnStartup: true,
    normalize: (value: number) => {
      const opacity = Number(value)
      return Number.isFinite(opacity) ? Math.min(1, Math.max(MIN_COMPONENT_OPACITY, opacity)) : 1
    },
    applyValue: (value: number) => applyComponentOpacity(value),
  },
  "general.containerColor": {
    label: "容器颜色",
    description: "浅色模式下卡片、侧边栏与弹层的背景色，与组件透明度组合生效",
    valueType: "string",
    default: DEFAULT_CONTAINER_COLOR,
    storage: "local",
    apply: "live",
    applyOnStartup: true,
    normalize: (value: string) => (/^#[\da-fA-F]{6}$/.test(String(value)) ? String(value).toLowerCase() : DEFAULT_CONTAINER_COLOR),
    applyValue: (value: string) => applyContainerColor(value),
  },
  "general.language": {
    label: "界面语言",
    description: "切换后需要刷新页面才能完全生效，暂未接入多语言",
    valueType: "string",
    default: "zh-CN",
    options: LANGUAGE_OPTIONS,
    storage: "local",
    apply: "reload",
  },
  "general.simpleMenu": {
    label: "便捷功能",
    description: "控制右上角便捷菜单显隐，暂未适配",
    valueType: "string",
    default: "1",
    options: SIMPLE_MENU_OPTIONS,
    storage: "local",
    apply: "reload",
  },
  "account.nickname": {
    label: "昵称",
    description: "账号昵称，登录后可用",
    valueType: "string",
    default: "",
    storage: "local",
    apply: "live",
  },
  "account.autoLogin": {
    label: "自动登录",
    description: "启动时自动恢复登录状态",
    valueType: "boolean",
    default: false,
    storage: "local",
    apply: "live",
  },
  "update.autoCheck": {
    label: "启动时检查更新",
    description: "关闭后启动不再自动检查；设置页手动检查不受影响",
    valueType: "boolean",
    default: true,
    storage: "local",
    apply: "live",
  },
  "update.autoCheckOnce": {
    label: "本次会话已自动检查更新",
    description: "会话级标记，保证自动检查在一次会话（含刷新）内只执行一次，关闭应用后自动失效",
    valueType: "boolean",
    default: false,
    storage: "session",
    apply: "live",
  },
  "announcement.notify": {
    label: "接收公告通知",
    description: "开启后将在启动时展示最新公告",
    valueType: "boolean",
    default: true,
    storage: "local",
    apply: "live",
  },
} as const satisfies Record<string, SettingItem>

/** 所有设置项的唯一 key */
export type SettingKey = keyof typeof SETTINGS

/** 指定 key 对应的值类型 */
export type SettingValue<K extends SettingKey> = SettingValueOf<(typeof SETTINGS)[K]>

/** 全部设置项 key（遍历用） */
export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[]

/**
 * 取某个设置项的元信息
 * @param key 设置项唯一键
 */
export const settingMeta = <K extends SettingKey>(key: K) => SETTINGS[key]
