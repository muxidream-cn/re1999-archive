import { ClipboardPaste, Copy, Download, ExternalLink, Link, RefreshCw, TextSelect } from "@lucide/vue"
import { toast } from "vue-sonner"

import { hasUtils, openUrl } from "@app/core/adapters/utils"
import useDevice from "@app/core/hooks/useDevice"
import useImageDownload from "@app/core/hooks/useImageDownload"

import { ContextGroupName, contextGroupOrder, type ContextGroupNameValue, type ContextTarget } from "./contextMenuConfig"

import type { Component } from "vue"

/** 菜单动作 id，同时用于 data-context-actions 白名单 */
export const ContextActionId = {
  copy: "copy",
  paste: "paste",
  selectAll: "select-all",
  copyImage: "copy-image",
  saveImage: "save-image",
  copyLink: "copy-link",
  openLink: "open-link",
  reload: "reload",
} as const

export type ContextActionIdValue = (typeof ContextActionId)[keyof typeof ContextActionId]

/** 单个菜单项 */
export interface ContextActionItem {
  id: ContextActionIdValue
  label: string
  icon: Component
  shortcut?: string
  group: ContextGroupNameValue
  run: (ctx: ContextTarget) => void | Promise<void>
  enabled?: (ctx: ContextTarget) => boolean
}

/** 一组菜单项，渲染时组间插入分隔线与小标题 */
export interface ContextMenuGroupItem {
  group: ContextGroupNameValue
  items: ContextActionItem[]
}

/** 各分组的默认动作及顺序 */
const groupActions: Record<ContextGroupNameValue, ContextActionIdValue[]> = {
  edit: [ContextActionId.copy, ContextActionId.paste, ContextActionId.selectAll],
  image: [ContextActionId.copyImage, ContextActionId.saveImage],
  link: [ContextActionId.copyLink, ContextActionId.openLink],
  page: [ContextActionId.reload],
}

/**
 * 兼容复制：剪贴板 API 不可用或被拒时的兜底
 * @param text
 */
const legacyCopy = (text: string) => {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  return copied
}

/**
 * 从图片地址推断文件名
 * @param url
 */
const fileNameFromUrl = (url: string) => {
  const fallback = "image.jpg"

  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "")
    return name || fallback
  } catch (error) {
    console.warn("解析图片文件名失败", error)
    return fallback
  }
}

/**
 * 右键菜单动作集合
 *
 * 动作实现集中在 composable 内，视图层只负责按分组渲染，
 * 新增动作时在这里登记后同步 groupActions 即可。
 */
export const useContextActions = () => {
  const { isWeb } = useDevice()
  const { customDownload, downloadImg } = useImageDownload()

  /**
   * 复制文本：优先 Clipboard API，失败回退 textarea + execCommand
   * @param text
   */
  const copyText = async (text: string) => {
    if (!text) {
      toast.info("没有可复制的内容")
      return
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("当前环境不支持剪贴板 API")
      await navigator.clipboard.writeText(text)
      toast.success("已复制")
    } catch (error) {
      console.warn("剪贴板写入失败，尝试兼容复制", error)
      if (legacyCopy(text)) {
        toast.success("已复制")
        return
      }
      toast.error("复制失败，请手动选择后复制")
    }
  }

  /**
   * 还原右键前的光标位置：菜单夺焦后输入框的选区会丢失
   * @param ctx
   */
  const restoreSelection = (ctx: ContextTarget) => {
    const editable = ctx.editable
    if (!editable) return

    editable.focus()
    if (
      (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) &&
      ctx.selectionStart !== null &&
      ctx.selectionEnd !== null
    ) {
      editable.setSelectionRange(ctx.selectionStart, ctx.selectionEnd)
    }
  }

  /**
   * 粘贴：execCommand 会派发原生 input 事件，v-model 才能同步且保留撤销栈
   * @param ctx
   */
  const pasteText = async (ctx: ContextTarget) => {
    if (!ctx.editable) return

    restoreSelection(ctx)

    let text = ""
    try {
      text = await navigator.clipboard.readText()
    } catch (error) {
      console.warn("读取剪贴板失败", error)
      toast.warning("无法读取剪贴板，请使用 Ctrl+V 粘贴")
      return
    }

    if (!text) return
    if (!document.execCommand("insertText", false, text)) {
      toast.warning("粘贴失败，请使用 Ctrl+V")
    }
  }

  /**
   * 全选：输入框选中全部内容，普通节点选中其内容
   * @param ctx
   */
  const selectAll = (ctx: ContextTarget) => {
    const editable = ctx.editable

    if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
      editable.focus()
      editable.select()
      return
    }

    if (editable) {
      const range = document.createRange()
      range.selectNodeContents(editable)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }

    const container = ctx.range?.commonAncestorContainer ?? null
    const host = container instanceof Element ? container : (container?.parentElement ?? null)
    if (!host) return

    const range = document.createRange()
    range.selectNodeContents(host)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  /**
   * 图片另存为：桌面端走 fileSaver 保存框，web 端走浏览器下载
   * @param ctx
   */
  const saveImage = async (ctx: ContextTarget) => {
    if (!ctx.src) {
      toast.warning("没有取到图片地址")
      return
    }

    const name = ctx.name || fileNameFromUrl(ctx.src)
    if (isWeb.value) {
      await downloadImg(ctx.src, name)
      return
    }

    await customDownload([{ url: ctx.src, name }])
  }

  /**
   * 在系统浏览器打开链接，适配器未配置时退回 window.open
   * @param href
   */
  const openLink = async (href: string) => {
    if (!href) return

    try {
      if (hasUtils()) {
        await openUrl(href)
        return
      }
      window.open(href, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("打开链接失败", error)
      toast.error("打开链接失败")
    }
  }

  const actions: ContextActionItem[] = [
    {
      id: ContextActionId.copy,
      label: "复制",
      icon: Copy,
      shortcut: "Ctrl+C",
      group: ContextGroupName.edit,
      run: (ctx) => copyText(ctx.text),
      enabled: (ctx) => Boolean(ctx.text),
    },
    {
      id: ContextActionId.paste,
      label: "粘贴",
      icon: ClipboardPaste,
      shortcut: "Ctrl+V",
      group: ContextGroupName.edit,
      run: pasteText,
      enabled: (ctx) => Boolean(ctx.editable),
    },
    {
      id: ContextActionId.selectAll,
      label: "全选",
      icon: TextSelect,
      shortcut: "Ctrl+A",
      group: ContextGroupName.edit,
      run: selectAll,
      enabled: (ctx) => Boolean(ctx.editable || ctx.range),
    },
    {
      id: ContextActionId.copyImage,
      label: "复制图片地址",
      icon: Link,
      group: ContextGroupName.image,
      run: (ctx) => copyText(ctx.src),
      enabled: (ctx) => Boolean(ctx.src),
    },
    {
      id: ContextActionId.saveImage,
      label: "图片另存为",
      icon: Download,
      group: ContextGroupName.image,
      run: saveImage,
      enabled: (ctx) => Boolean(ctx.src),
    },
    {
      id: ContextActionId.copyLink,
      label: "复制链接地址",
      icon: Link,
      group: ContextGroupName.link,
      run: (ctx) => copyText(ctx.href),
      enabled: (ctx) => Boolean(ctx.href),
    },
    {
      id: ContextActionId.openLink,
      label: "在浏览器打开",
      icon: ExternalLink,
      group: ContextGroupName.link,
      run: (ctx) => openLink(ctx.href),
      enabled: (ctx) => /^(https?:|mailto:)/i.test(ctx.href),
    },
    {
      id: ContextActionId.reload,
      label: "刷新页面",
      icon: RefreshCw,
      shortcut: "F5",
      group: ContextGroupName.page,
      run: () => window.location.reload(),
    },
  ]

  const actionMap = new Map(actions.map((action) => [action.id, action]))

  /**
   * 解析本次右键要渲染的分组
   *
   * - `data-context-actions` 存在时按白名单取动作，仍按动作所属分组归组；
   * - 否则取命中分组的默认动作；
   * - 当前上下文不可用的动作保留为禁用态（用户仍能看见能力存在），空分组不渲染。
   * @param ctx
   */
  const resolveMenuGroups = (ctx: ContextTarget): ContextMenuGroupItem[] => {
    if (ctx.disabled || !ctx.groups.length) return []

    const wanted = ctx.actionIds ? new Set(ctx.actionIds) : null
    const picked = wanted
      ? actions.filter((action) => wanted.has(action.id))
      : ctx.groups
          .flatMap((group) => groupActions[group].map((id) => actionMap.get(id)))
          .filter((action): action is ContextActionItem => Boolean(action))

    if (!picked.length) return []

    return contextGroupOrder
      .map((group) => ({
        group,
        items: picked.filter((action) => action.group === group),
      }))
      .filter((item) => item.items.length > 0)
  }

  return { actions, resolveMenuGroups }
}
