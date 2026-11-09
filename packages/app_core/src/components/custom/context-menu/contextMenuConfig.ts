/**
 * 全局右键菜单的分组与元素标识配置
 *
 * 元素通过在自身或祖先节点上写 `data-context-*` 属性声明要显示哪组菜单，
 * 未加标识的元素由 `resolveContext` 按标签兜底识别。
 */

/** 右键菜单分组名，同时作为 `data-context-menu` 的取值 */
export const ContextGroupName = {
  edit: "edit",
  image: "image",
  link: "link",
  page: "page",
} as const

export type ContextGroupNameValue = keyof typeof ContextGroupName

/** 分组固定顺序：多组同时命中时按此顺序渲染，避免菜单项顺序抖动 */
export const contextGroupOrder: ContextGroupNameValue[] = [
  ContextGroupName.edit,
  ContextGroupName.image,
  ContextGroupName.link,
  ContextGroupName.page,
]

/** 分组标题，渲染为菜单内的小标题 */
export const contextGroupLabel: Record<ContextGroupNameValue, string> = {
  edit: "编辑",
  image: "图片",
  link: "链接",
  page: "页面",
}

/** 元素标识的属性名，统一在这里维护，避免散落在组件里 */
export const ContextMenuAttr = {
  groups: "data-context-menu",
  actions: "data-context-actions",
  src: "data-context-src",
  name: "data-context-name",
  href: "data-context-href",
} as const

/** `data-context-menu="none"` 表示该区域禁用右键菜单 */
export const CONTEXT_MENU_NONE = "none"

/** 右键瞬间的上下文快照，所有动作只读取这一份数据 */
export interface ContextTarget {
  /** 命中的分组，已按 contextGroupOrder 排序去重 */
  groups: ContextGroupNameValue[]
  /** `data-context-actions` 指定的动作白名单，null 表示使用分组的默认动作 */
  actionIds: string[] | null
  /** 命中 `data-context-menu="none"` */
  disabled: boolean
  /** 可复制的文本：输入框取选中片段，其余取当前选区 */
  text: string
  /** 图片地址：优先取标识覆盖，其次取图片元素的 src */
  src: string
  /** 图片文件名：优先取标识覆盖，其次取图片 alt */
  name: string
  /** 链接地址：优先取标识覆盖，其次取最近的 a[href] */
  href: string
  /** 命中的可编辑元素 */
  editable: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null
  /** 输入框/文本域的选区范围，用于粘贴前还原光标位置 */
  selectionStart: number | null
  selectionEnd: number | null
  /** 非输入框的选区范围，用于「全选」与「复制」 */
  range: Range | null
}

/** 这些 input 类型不支持文本编辑，右键不应给出编辑组 */
const nonTextInputTypes = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"])

/** 可编辑元素选择器，显式排除 contenteditable="false" 的容器 */
const editableSelector = "input, textarea, [contenteditable]:not([contenteditable='false'])"

/**
 * 拆分空格或逗号分隔的属性值
 * @param raw
 */
const splitAttr = (raw: string | null | undefined) =>
  (raw ?? "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * 在祖先链上找可编辑元素，并过滤掉不可输入文本的 input
 * @param element
 */
const findEditable = (element: Element | null): ContextTarget["editable"] => {
  const candidate = element?.closest<HTMLElement>(editableSelector)
  if (!candidate) return null
  if (candidate instanceof HTMLInputElement && nonTextInputTypes.has(candidate.type)) return null
  return candidate
}

/**
 * 取图片元素，包含 currentSrc（响应式图片优先用实际加载地址）
 * @param element
 */
const findImage = (element: Element | null): HTMLImageElement | null => {
  if (element instanceof HTMLImageElement) return element
  return element?.closest<HTMLImageElement>("img") ?? null
}

/**
 * 取最近的链接元素
 * @param element
 */
const findAnchor = (element: Element | null): HTMLAnchorElement | null => element?.closest<HTMLAnchorElement>("a[href]") ?? null

/**
 * 读取输入框内的选中文本
 * @param editable
 */
const readEditableText = (editable: ContextTarget["editable"]) => {
  if (!editable) return ""
  if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
    const start = editable.selectionStart ?? 0
    const end = editable.selectionEnd ?? 0
    return editable.value.slice(start, end)
  }
  return window.getSelection()?.toString() ?? ""
}

/**
 * 未命中标识时的标签兜底：按元素类型推断应显示的分组
 * @param params
 * @param params.editable
 * @param params.hasSelection
 * @param params.image
 * @param params.anchor
 */
const inferGroups = (params: {
  editable: ContextTarget["editable"]
  hasSelection: boolean
  image: HTMLImageElement | null
  anchor: HTMLAnchorElement | null
}): ContextGroupNameValue[] => {
  const groups = new Set<ContextGroupNameValue>()

  if (params.editable || params.hasSelection) groups.add(ContextGroupName.edit)
  if (params.image) groups.add(ContextGroupName.image)
  if (params.anchor) groups.add(ContextGroupName.link)
  if (!groups.size) groups.add(ContextGroupName.page)

  return contextGroupOrder.filter((group) => groups.has(group))
}

/**
 * 解析右键上下文
 *
 * 解析顺序：
 * 1. 最近的 `[data-context-menu]`（含 `none` 禁用）；
 * 2. 未加标识时按标签兜底：可编辑元素 / 选中文本 → 编辑组，img → 图片组，a[href] → 链接组，其余 → 页面组；
 * 3. 标识分组不含 link 但元素位于链接内时，追加链接组。
 * @param target
 */
export function resolveContext(target: EventTarget | null): ContextTarget {
  const element = target instanceof Element ? target : null
  const selection = window.getSelection()
  const selectionText = selection?.toString() ?? ""
  const marker = element?.closest<HTMLElement>(`[${ContextMenuAttr.groups}]`) ?? null
  const markerValues = splitAttr(marker?.getAttribute(ContextMenuAttr.groups))
  const disabled = markerValues.includes(CONTEXT_MENU_NONE)

  const editable = findEditable(element)
  const image = findImage(element)
  const anchor = findAnchor(element)

  const markedGroups = contextGroupOrder.filter((group) => markerValues.includes(group))
  const hasSelection = Boolean(selectionText.trim())

  let groups: ContextGroupNameValue[] = []
  if (!disabled) {
    groups = markedGroups.length ? [...markedGroups] : inferGroups({ editable, hasSelection, image, anchor })
    // 图片卡片往往整体被链接包裹，右键图片时补上链接组，避免“打开链接”缺项
    if (anchor && !groups.includes(ContextGroupName.link)) groups.push(ContextGroupName.link)
    groups = contextGroupOrder.filter((group) => groups.includes(group))
  }

  const editableRange =
    editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement
      ? { start: editable.selectionStart, end: editable.selectionEnd }
      : { start: null, end: null }
  const actionValues = splitAttr(marker?.getAttribute(ContextMenuAttr.actions))

  return {
    groups,
    actionIds: actionValues.length ? actionValues : null,
    disabled,
    text: editable ? readEditableText(editable) : selectionText,
    src: marker?.getAttribute(ContextMenuAttr.src) || image?.currentSrc || image?.src || "",
    name: marker?.getAttribute(ContextMenuAttr.name) || image?.alt || "",
    href: marker?.getAttribute(ContextMenuAttr.href) || anchor?.href || "",
    editable,
    selectionStart: editableRange.start,
    selectionEnd: editableRange.end,
    range: selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null,
  }
}
