import { Info, Megaphone, RefreshCcw, Settings2, UserRound } from "@lucide/vue"

import { openUrl } from "@app/core/adapters/utils"
import useDevice from "@app/core/hooks/useDevice"
import useSystem from "@app/core/hooks/useSystem"
import useTheme from "@app/core/hooks/useTheme"
import { settingMeta } from "@app/core/views/settings/schema.js"

import AboutSection from "./components/AboutSection.vue"
import AnnouncementSection from "./components/AnnouncementSection.vue"
import UpdateSection from "./components/UpdateSection.vue"
import { defineSettingsField, type AboutAppInfo, type SettingsSectionConfig } from "./types"

const currentVersion: string = import.meta.env.VITE_APP_VERSION

const { isWeb } = useDevice()
// useSystem() 只创建闭包，不在模块加载期访问 DOM / Pinia；点击时才真正执行背景操作
const { changeBG, clearBG } = useSystem()

/** 组件透明度的取值范围来自 Schema，避免 UI 与存储两侧各写一套 */
const opacityBounds = settingMeta("general.componentOpacity").bounds

/**
 * 设置页配置
 *
 * - 所有分区 / 字段均由此驱动，接入真实接口时只需替换或增删配置，不用改页面组件
 * - 字段的名称 / 说明 / 默认值来自 `settings/schema.ts`，这里只声明控件细节
 * - 值变化后的副作用（CSS 变量等）由 Schema 的 `applyValue` 负责，无需在 onChange 里重复
 * - `visible: false` 的分区不会渲染也不会出现在左侧导航
 */
export const settingsSections: SettingsSectionConfig[] = [
  {
    id: "general",
    title: "通用",
    icon: Settings2,
    visible: true,
    fields: [
      {
        ...defineSettingsField("general.theme", {
          type: "select",
          options: settingMeta("general.theme").options,
        }),
      },
      {
        key: "general.changeBackground",
        type: "action",
        label: "切换背景图",
        description: "更换随机壁纸",
        buttonLabel: "切换",
        // 深色模式不显示背景，禁用可避免切换后看不到效果；函数形式随主题/系统外观实时更新
        disabled: () => useTheme().isDark.value,
        disabledHint: "仅浅色模式可用",
        action: () => {
          void changeBG(true).catch((err: unknown) => console.warn("背景切换失败", err instanceof Error ? err.message : "未知错误"))
        },
      },
      {
        key: "general.clearBackground",
        type: "action",
        label: "清除背景图",
        description: "清除后保持无背景，直到再次点击「切换背景图」",
        buttonLabel: "清除",
        action: () => clearBG(),
      },
      {
        ...defineSettingsField("general.componentOpacity", {
          type: "slider",
          min: opacityBounds.min,
          max: opacityBounds.max,
          step: opacityBounds.step,
          format: (value: number) => `${Math.round(value * 100)}%`,
        }),
      },
      {
        ...defineSettingsField("general.containerColor", { type: "color" }),
      },
      {
        ...defineSettingsField("general.language", {
          type: "select",
          options: settingMeta("general.language").options,
          disabled: true,
        }),
      },
      {
        ...defineSettingsField("general.simpleMenu", {
          type: "select",
          options: settingMeta("general.simpleMenu").options,
          disabled: true,
        }),
      },
    ],
  },
  /* 单独设置页面 */
  {
    id: "announcement",
    title: "公告",
    icon: Megaphone,
    visible: false,
    component: AnnouncementSection,
    componentProps: {
      announcements: [
        {
          id: 1,
          date: "2026-10-28",
          title: "壁纸库版本更新",
          content: "新增《重返未来：1999》近期活动角色壁纸共 32 张，支持按版本筛选下载。",
        },
        {
          id: 2,
          date: "2026-10-12",
          title: "下载器 Beta 上线",
          content: "桌面端下载器进入 Beta 阶段，支持断点续传与批量下载，欢迎反馈问题。",
        },
        {
          id: 3,
          date: "2026-09-30",
          title: "站点维护公告",
          content: "服务器将于凌晨 2:00 - 4:00 进行维护，期间下载服务可能短暂不可用。",
        },
      ],
    },
  },
  {
    id: "update",
    title: "更新设置",
    icon: RefreshCcw,
    // Web 端没有 UpdateDialog 与更新能力，隐藏该分区；visibleSections 同时驱动页面卡片与侧栏子菜单
    visible: import.meta.env.VITE_APP_DEVICE !== "web",
    component: UpdateSection,
  },
  {
    id: "account",
    title: "账户",
    icon: UserRound,
    // 接口与功能尚未完成，先隐藏；完成后改为 true 即可
    visible: false,
    fields: [
      {
        ...defineSettingsField("account.nickname", { type: "input", placeholder: "登录后可用", disabled: true }),
      },
      {
        ...defineSettingsField("account.autoLogin", { type: "switch" }),
      },
    ],
  },
  {
    id: "about",
    title: "关于",
    icon: Info,
    visible: true,
    component: AboutSection,
    componentProps: {
      appInfo: {
        name: "默默的小站：游戏壁纸",
        version: currentVersion,
        description: "《重返未来：1999》游戏壁纸收录与下载工具",
        // 链接按展示顺序排列；tauriOnly 的条目在 web 端不显示
        links: [
          { label: "项目地址", url: "https://github.com/muxidream-cn/re1999-archive" },
          { label: "网站地址", url: "https://download.muxidream.cn", hide: isWeb.value },
          { label: "隐私协议", url: "/privacyPolicy.html" },
        ],
        copyright: "Copyright © 2026 默默 (MoMo). 保留所有权利.",
      } satisfies AboutAppInfo,
      openUrl: (url: string) => openUrl(url),
    },
  },
]

/** 可见的分区（页面渲染与左侧导航共用） */
export const visibleSections = settingsSections.filter((section) => section.visible !== false)
