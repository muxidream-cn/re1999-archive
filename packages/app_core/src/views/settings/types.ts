import { settingMeta, type SettingKey } from "@app/core/views/settings/schema"

import type { LucideIcon } from "@lucide/vue"
import type { Component } from "vue"

/** 自定义值来源：提供后该字段绕过设置存储，直接读写指定数据源 */
export type SettingsValueSource<T = string> = {
  get: () => T
  set: (value: T) => void
}

/**
 * 控件细节：只描述如何渲染与交互
 * 名称 / 说明 / 默认值统一来自 `settings/schema.ts`，不在此重复
 */
export type SettingsFieldControl =
  | { type: "switch"; disabled?: boolean }
  | {
      type: "select"
      options: readonly { label: string; value: string; disabled?: boolean }[]
      disabled?: boolean
      onChange?: (value: string) => void
    }
  | { type: "input"; placeholder?: string; disabled?: boolean; onChange?: (value: string) => void }
  | { type: "color"; disabled?: boolean; onChange?: (value: string) => void }
  | {
      type: "slider"
      min: number
      max: number
      step: number
      format?: (value: number) => string
      onChange?: (value: number) => void
    }
  | {
      type: "action"
      buttonLabel: string
      action: () => void | Promise<void>
      disabled?: boolean | (() => boolean)
      disabledHint?: string
    }

/**
 * 设置页字段配置
 * - 设置类字段必须绑定 Schema 的 key，label / description 由 `defineSettingsField` 注入
 * - action 字段是纯按钮（切换背景图等），不对应任何设置项
 */
export type SettingsFieldConfig = (
  | (Exclude<SettingsFieldControl, { type: "action" }> & { key: SettingKey })
  | (Extract<SettingsFieldControl, { type: "action" }> & { key: string })
) & {
  /** 展示名；设置类字段来自 Schema */
  label: string
  /** 说明，仅作文档与悬浮提示，不在字段下方展示 */
  description?: string
  /** 自定义读写源，提供后绕过设置存储 */
  valueSource?: SettingsValueSource<any>
}

/**
 * 由 Schema 的 key 组装字段配置
 * @param key 设置项唯一键
 * @param control 控件细节
 */
export const defineSettingsField = (key: SettingKey, control: SettingsFieldControl): SettingsFieldConfig => {
  const meta = settingMeta(key)
  return { ...control, key, label: meta.label, description: meta.description } as SettingsFieldConfig
}

/** 设置页分区配置 */
export type SettingsSectionConfig = {
  /** 锚点 id（url ?section= 与滚动定位使用） */
  id: string
  title: string
  icon?: LucideIcon
  /** 是否可见（如“账户”接口未完成前先隐藏，做好后改为 true 即可） */
  visible?: boolean
  /** 通用字段列表（与 component 二选一） */
  fields?: SettingsFieldConfig[]
  /** 自定义区块内容（如 公告 / 检查更新 / 关于） */
  component?: Component
  /** 传给自定义组件的 props */
  componentProps?: Record<string, any>
}

/** 关于页的外部链接条目 */
export interface AboutLink {
  /** 展示名，如「项目地址」 */
  label: string
  /** 点击后打开的地址，站内相对路径也支持 */
  url: string
  /** 是否显示 */
  hide?: boolean
}

/** 关于页展示的应用信息 */
export interface AboutAppInfo {
  name: string
  version: string
  description: string
  /** 外部链接列表（项目地址 / 网站地址 / 隐私协议等），顺序即展示顺序 */
  links: AboutLink[]
  copyright: string
}

/**
 * 触发字段配置的联动行为（按具体类型收窄，绕开联合函数参数交叉为 never 的问题）
 * @param field 字段配置
 * @param value 变更后的值
 */
export const applyFieldChange = (field: SettingsFieldConfig, value: unknown) => {
  if (field.type === "select" || field.type === "input" || field.type === "color") field.onChange?.(value as string)
  else if (field.type === "slider") field.onChange?.(value as number)
}
