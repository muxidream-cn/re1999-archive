import { createVNode, getCurrentInstance, render, watch, type AppContext, type Component } from "vue"
import { toast } from "vue-sonner"

import { useUpdater } from "@app/core/adapters/updater/useUpdater"
import { canAutoCheckThisSession, markAutoChecked } from "@app/core/hooks/useSettings"

/** 各端更新弹窗的懒加载器，由条件编译按平台只保留一项 */
type UpdateDialogLoader = () => Promise<{ default: Component }>

/**
 * 平台弹窗加载器：`vue-tsc` 不处理 `#ifdef`，所有分支都会参与类型检查，
 * 因此用「键名唯一的对象字面量」表达条件导出，避免同名声明冲突。
 * web 端两个条件都为 false，此处为空对象（web 端不会装配弹窗）。
 */
const updateDialogLoaders: Record<string, UpdateDialogLoader> = {
  // #ifdef windows
  windows: () => import("./updateDialog.windows.vue"),
  // #endif
  // #ifdef android
  android: () => import("./updateDialog.android.vue"),
  // #endif
}

/** 取当前平台唯一保留的加载器；抛错仅用于兜底类型检查与意外调用 */
const loadUpdateDialog = async (): Promise<Component> => {
  const loader = Object.values(updateDialogLoaders)[0]
  if (!loader) throw new Error("当前平台没有可用的更新弹窗")
  return (await loader()).default
}

let appContext: AppContext | null = null
let container: HTMLElement | null = null
let mounting: Promise<void> | null = null
let initialized = false

/** 首次发现更新时才挂载弹窗；之后常驻，由 isDialogOpen 控制显隐 */
const mountDialog = async () => {
  if (container || mounting) return
  if (!appContext) {
    console.error("UpdateDialog 缺少主应用上下文，无法挂载")
    return
  }

  const context = appContext
  mounting = (async () => {
    const UpdateDialog = await loadUpdateDialog()
    const host = document.createElement("div")
    document.body.appendChild(host)
    const vnode = createVNode(UpdateDialog)
    // 复用主应用上下文，独立渲染的弹窗才能拿到 Pinia 与全局插件
    vnode.appContext = context
    render(vnode, host)
    container = host
  })()

  try {
    await mounting
  } catch (error) {
    mounting = null
    console.error("挂载更新弹窗失败", error)
    toast.error(error instanceof Error ? error.message : "更新弹窗加载失败")
  }
}

/**
 * 初始化更新弹窗：注册按需挂载，并承载启动自动检查
 * @param context 主应用上下文，供独立挂载的弹窗复用 Pinia 与全局插件
 */
export const initUpdateDialog = (context?: AppContext | null) => {
  const controller = useUpdater()
  // Web 端或尚未配置更新适配器时不做任何装配
  if (!controller) return

  appContext = context ?? getCurrentInstance()?.appContext ?? null
  if (initialized) return
  initialized = true

  watch(controller.isDialogOpen, (open) => {
    if (open) void mountDialog()
  })

  // 「启动时检查更新」开关 + 会话标记：同一次会话（含刷新）只自动检查一次；设置页手动点击不受影响
  if (!canAutoCheckThisSession()) return
  setTimeout(() => {
    // 真正发起检查时才置位，避免延迟窗口内刷新就永久跳过本会话
    markAutoChecked()
    void controller.checkForUpdate().catch((error: unknown) => {
      console.error("检查更新失败", error)
      toast.error(error instanceof Error ? error.message : "检查更新失败")
    })
    // 强制显示更新弹窗，调试用
    // controller.isDialogOpen.value = true
  }, 3000)
}
