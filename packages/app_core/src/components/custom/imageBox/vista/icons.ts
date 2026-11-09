/**
 * 工具栏图标
 * 统一 viewBox 24x24、描边风格，与 VistaView 内置图标保持一致，避免工具栏视觉割裂
 */
export const ICONS = {
  /** 逆时针旋转 */
  rotateLeft: `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
  /** 顺时针旋转 */
  rotateRight: `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>`,
  /** 水平翻转 */
  flipHorizontal: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangles-centerline-dashed-vertical preview-icon"><path d="M12 14v2"/><path d="M12 20v2"/><path d="M12 2v2"/><path d="M12 8v2"/><path d="M20.288 16.703A1 1 0 0022 16V8a1 1 0 00-1.712-.703l-3.99 3.991a1 1 0 00-.001 1.424z"/><path d="M3.712 16.703A1 1 0 012 16V8a1 1 0 011.712-.703l3.99 3.991a1 1 0 01.001 1.424z"/></svg>`,
  /** 垂直翻转 */
  flipVertical: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangles-centerline-dashed-horizontal preview-icon"><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/><path d="M4 12H2"/><path d="M7.298 20.288A1 1 0 008 22h8a1 1 0 00.703-1.712l-3.991-3.99a1 1 0 00-1.424-.001z"/><path d="M7.298 3.712A1 1 0 018 2h8a1 1 0 01.703 1.712l-3.991 3.99a1 1 0 01-1.424.001z"/></svg>`,
  /** 进入全屏 */
  enterFullscreen: `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`,
  /** 退出全屏 */
  exitFullscreen: `<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>`,
  /**
   * 还原默认大小（四角向内）
   * 刻意与 exitFullscreen 的四角向外区分，避免相邻按钮视觉混淆
   */
  fitScreen: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shrink preview-icon"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></svg>`,
  /** 播放 */
  play: `<path d="M7 4.5v15l13-7.5z"/>`,
  /** 暂停 */
  pause: `<rect x="7" y="4.5" width="3.5" height="15" rx="1"/><rect x="13.5" y="4.5" width="3.5" height="15" rx="1"/>`,
  /** 下载 */
  download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>`,
  /** 眼睛（恢复界面） */
  eye: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
  /** 划掉的眼睛（隐藏界面只看大图） */
  eyeOff: `<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>`,
  /** 上一张 */
  chevronLeft: `<path d="m15 18-6-6 6-6"/>`,
  /** 下一张 */
  chevronRight: `<path d="m9 18 6-6-6-6"/>`,
  /** 更多（三点，配合实心渲染使用） */
  more: `<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>`,
} as const

/**
 * 把图标写入按钮
 * @param button 目标按钮
 * @param icon ICONS 中的图标片段
 * @param filled 是否为实心图标（播放/暂停用实心，其余为描边）
 */
export const setButtonIcon = (button: HTMLButtonElement, icon: string, filled = false) => {
  // 内联 style 优先级高于 .vvw-ui>button svg 的基础样式，实心图标需要在描边规则上覆盖
  const style = filled ? "fill:currentColor;stroke:none" : "fill:none;stroke:currentColor"
  button.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" style="${style}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`
}

/**
 * 创建一个工具栏按钮
 * @param icon ICONS 中的图标片段
 * @param label 无障碍名称
 * @param filled 是否为实心图标
 */
export const createIconButton = (icon: string, label: string, filled = false) => {
  const button = document.createElement("button")
  button.type = "button"
  button.setAttribute("aria-label", label)
  button.title = label
  setButtonIcon(button, icon, filled)
  // 阻止冒泡，避免触发库的指针手势（滑动切换 / 下滑关闭）
  button.addEventListener("pointerdown", (event) => event.stopPropagation())
  return button
}
