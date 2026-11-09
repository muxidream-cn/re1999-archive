import { VistaHiresTransition, VistaImage, type VistaImageParams, type VistaView } from "vistaview"

import type { VistaGalleryImgConfig } from "./types"

/** 顶部工具栏占用的高度变量，由 measureSafeArea 写入 .vvw-container */
const SAFE_TOP_VAR = "--vvg-safe-top"
/** 底部信息区占用的高度变量，由 measureSafeArea 写入 .vvw-container */
const SAFE_BOTTOM_VAR = "--vvg-safe-bottom"
/** 实测的顶部占位高度，存在 .vvw-container 的 dataset 上，让位结束后用它还原 */
const SAFE_TOP_KEY = "vvgSafeTop"
/** 实测的底部占位高度，同上 */
const SAFE_BOTTOM_KEY = "vvgSafeBottom"
/** 放大标记，写在 .vvw-root 上，供 CSS 让底部信息区滑出并让出空间 */
const ZOOM_ATTR = "data-vvg-zoomed"
/** 沉浸标记，写在 .vvw-root 上，上下信息区与左右翻页箭头一起滑出 */
const IMMERSIVE_ATTR = "data-vvg-immersive"
/**
 * 容器高度 / 偏移缓动的开关标记，规则在 vista-theme.css
 *
 * 只有「安全区因用户主动操作而变化」的场景需要它：沉浸切换、放大后底部让位。
 * 全屏进出、窗口尺寸变化不能有过渡——图片是瞬时贴合新盒子的，容器若还在 240ms 里滑过去，
 * 两者节奏错开，图片会被 overflow 短暂裁掉一截
 */
const FIT_TRANSITION_ATTR = "data-vvg-fit-transition"
/** 标记存活时长，与 CSS 里的 240ms 对齐并多留一帧余量 */
const FIT_TRANSITION_MS = 260
/** 移除标记的计时器，连续触发时先清掉上一次 */
let fitTransitionTimer = 0

/**
 * 占位层在主图就位后继续保留的时长
 *
 * 主图拿到 .vvw--loaded 后按 200ms 淡入（见 vista-theme.css），期间它还是半透明的，
 * 提前摘掉占位层会露出黑底闪一下；这里多留一帧余量，等淡入彻底结束再移除
 */
const PLACEHOLDER_HOLD_MS = 260

/**
 * 短暂打开 .vvw-image-container 的 height/top 缓动
 *
 * 必须在写 --vvg-safe-* 之前调用：transition 不在变化前存在，这次高度变化就不会触发过渡。
 * @param root 灯箱根节点
 */
const openFitTransition = (root: HTMLElement | null) => {
  if (!root) return

  root.setAttribute(FIT_TRANSITION_ATTR, "")
  // 先让这条 transition 落地成当前计算样式，再写安全区；
  // 否则「新增 transition」与「值变化」落在同一次样式重算里，部分内核会直接瞬变、不播过渡
  void root.offsetHeight

  window.clearTimeout(fitTransitionTimer)
  fitTransitionTimer = window.setTimeout(() => {
    fitTransitionTimer = 0
    root.removeAttribute(FIT_TRANSITION_ATTR)
  }, FIT_TRANSITION_MS)
}

/**
 * 立刻关掉容器缓动
 *
 * 尺寸类变化要用：复位缩放时可能刚开启过缓动，图片已经瞬时贴合新盒子，
 * 容器若还滑 240ms，两者会短暂错位（图片被容器上下裁掉一截）
 * @param root 灯箱根节点
 */
const closeFitTransition = (root: HTMLElement | null) => {
  window.clearTimeout(fitTransitionTimer)
  fitTransitionTimer = 0
  root?.removeAttribute(FIT_TRANSITION_ATTR)
}

/**
 * 当前图片渲染就位的自定义事件，派发在 .vvw-root 上
 * 翻页节流靠它判断「这一页真的显示出来了」，比按动画时长估算可靠
 */
export const IMAGE_READY_EVENT = "vvg:image-ready"

/**
 * 主图（原图）解码完成或加载失败的事件，派发在 .vvw-root 上
 *
 * 与 IMAGE_READY_EVENT 刻意分开：后者在占位缩略图铺上时就派发（画面已经有内容），
 * 而「原图是否还在路上」需要更准确的信号，左上角 loading 靠它收尾。
 * 只对当前图派发——邻图加载的是缩略图，很早就会就绪，误发会让 loading 提前消失。
 */
export const IMAGE_LOADED_EVENT = "vvg:image-loaded"

/**
 * 把图片按原始比例装进给定盒子（等比缩放，不裁切）
 * @param naturalWidth 图片原始宽度
 * @param naturalHeight 图片原始高度
 * @param boxWidth 可用宽度
 * @param boxHeight 可用高度
 */
const fitIntoBox = (naturalWidth: number, naturalHeight: number, boxWidth: number, boxHeight: number) => {
  const aspect = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : boxWidth / Math.max(boxHeight, 1)

  let width = boxWidth
  let height = width / aspect
  if (height > boxHeight) {
    height = boxHeight
    width = height * aspect
  }

  return { width, height }
}

/**
 * 取画廊根节点（.vvw-root）
 * `VistaView.root` 是 private，只能从公开的 `imageContainer` 往上找
 * @param vistaView 画廊实例
 */
const getRoot = (vistaView: VistaView) => vistaView.imageContainer?.closest<HTMLElement>(".vvw-root") ?? null

/**
 * 测量顶部工具栏与底部信息区的高度
 *
 * 只在每次打开后的第一次测量，避免切图时说明文字行数变化引起图片尺寸跳动；
 * 实测值单独记在 dataset 上，沉浸 / 放大把变量写成 0 之后仍能还原。
 * @param container .vvw-container，所有工具栏与图片容器的公共父级
 */
const measureSafeArea = (container: HTMLElement | null) => {
  if (!container) return
  if (container.dataset[SAFE_TOP_KEY] !== undefined) return

  const topBar = container.querySelector<HTMLElement>(".vvw-top-bar")
  const bottomBar = container.querySelector<HTMLElement>(".vvw-bottom-bar")
  container.dataset[SAFE_TOP_KEY] = String(topBar?.offsetHeight ?? 0)
  container.dataset[SAFE_BOTTOM_KEY] = String(bottomBar?.offsetHeight ?? 0)
}

/**
 * 只在值变化时写 CSS 变量
 * @param container 变量宿主
 * @param name 变量名
 * @param value 目标值
 */
const setVar = (container: HTMLElement, name: string, value: string) => {
  if (container.style.getPropertyValue(name) === value) return
  container.style.setProperty(name, value)
}

/**
 * 按当前标记算出目标占位高度（只计算，不写样式）
 *
 * 沉浸优先级最高：上下都不占位，整块视口交给大图；
 * 其次是放大：只让出底部（放大后图片下缘会被容器底边裁掉，抬高高度才能看到全部）；
 * 其余情况用实测值。
 * @param root 灯箱根节点
 * @param container 变量宿主 .vvw-container
 */
const readAreaInsets = (root: HTMLElement, container: HTMLElement) => {
  const immersive = root.hasAttribute(IMMERSIVE_ATTR)
  const zoomed = root.hasAttribute(ZOOM_ATTR)
  const measuredTop = Number(container.dataset[SAFE_TOP_KEY] ?? 0)
  const measuredBottom = Number(container.dataset[SAFE_BOTTOM_KEY] ?? 0)

  return {
    top: immersive ? 0 : measuredTop,
    bottom: immersive || zoomed ? 0 : measuredBottom,
  }
}

/**
 * 按当前标记把可用区域写回 .vvw-container
 * @param vistaView 画廊实例
 */
const refreshSafeArea = (vistaView: VistaView) => {
  const container = vistaView.imageContainer?.parentElement
  const root = getRoot(vistaView)
  if (!container || !root) return

  const { top, bottom } = readAreaInsets(root, container)

  // 值没变就不写：改这两个变量会触发 .vvw-image-container 的 calc 重算，
  // 而 onScale 在拖动缩放时每帧都调，重复写会造成没必要的布局开销
  setVar(container, SAFE_TOP_VAR, `${top}px`)
  setVar(container, SAFE_BOTTOM_VAR, `${bottom}px`)
}

/**
 * 把「当前图片是否已放大」写到画布根节点上，并刷新可用区域
 *
 * 库只把这个状态留在 `state.zoomedIn`，既不加类也不写属性，CSS 无法感知，
 * 只能在这里桥接一次；底部信息区靠它滑出画面，顶部工具栏刻意不参与——放大后仍需保持可点。
 * @param vistaView 画廊实例
 * @param zoomed 是否已放大到适配尺寸以上
 */
const syncZoomState = (vistaView: VistaView, zoomed: boolean) => {
  const root = getRoot(vistaView)
  if (!root) return
  // 同上：拖动缩放时这个回调每帧都来，状态没变就什么都不做
  if (root.hasAttribute(ZOOM_ATTR) === zoomed) return

  root.toggleAttribute(ZOOM_ATTR, zoomed)
  // 放大后底部让位会让可用高度变化，这段过渡是既有的观感，保留
  openFitTransition(root)
  refreshSafeArea(vistaView)
}

/**
 * 缩放被复位的事件，派发在 .vvw-root 上
 *
 * 库只在 onScale 里维护缩放按钮的禁用态和 `state.zoomedIn`，而「回到适配尺寸」走的是直接改尺寸的路径，
 * 不经过 onScale；自研工具栏（还原默认大小等）靠这个事件补一次刷新，不必在这里猜按钮的 DOM 结构。
 */
export const ZOOM_RESET_EVENT = "vvg:zoom-reset"

/**
 * 把缩放相关状态与控件恢复成「未放大」
 *
 * 覆盖三处库不会自动同步的地方：
 * 1. `state.zoomedIn`：库只在 onScale 里写，normalize 路径不经过；
 * 2. 库自带的放大/缩小按钮：禁用态同样只在 onScale 里维护；
 * 3. 自研工具栏：通过 ZOOM_RESET_EVENT 通知。
 * 放大后切全屏（或还原大小）不刷新这三处，按钮会停在「还能继续还原」的旧状态上。
 * @param vistaView 画廊实例
 */
const syncZoomReset = (vistaView: VistaView) => {
  const root = getRoot(vistaView)
  vistaView.state.zoomedIn = false

  root?.querySelector(".vvw-zoom-out")?.setAttribute("disabled", "true")
  root?.querySelector(".vvw-zoom-in")?.removeAttribute("disabled")
  root?.dispatchEvent(new CustomEvent(ZOOM_RESET_EVENT))
}

/**
 * 切换沉浸模式
 *
 * 沉浸时上下信息区与左右翻页箭头都滑出，可用区域归零，只留右上角的悬浮还原按钮。
 * @param vistaView 画廊实例
 * @param immersive 是否进入沉浸
 */
export const setImmersive = (vistaView: VistaView, immersive: boolean) => {
  const root = getRoot(vistaView)
  if (!root || root.hasAttribute(IMMERSIVE_ATTR) === immersive) return

  // 沉浸是用户主动操作，安全区变化要有缓动
  openFitTransition(root)
  root.toggleAttribute(IMMERSIVE_ATTR, immersive)
  refreshSafeArea(vistaView)
}

/**
 * 画廊的图片容器
 *
 * 承担三件事：
 * 1. 可用区域：库默认把图片按整个视口 letterbox，会压住顶部按钮与底部说明/缩略图。
 *    这里收缩 `.vvw-image-container` 到两者之间，并覆盖 `getFullSizeDim()` 让尺寸按该区域计算。
 * 2. 尺寸策略：画廊使用数组模式初始化，库没有 DOM 原点元素，`VistaBox.setSizes()` 会提前返回，
 *    默认 `init()` 会从 0 宽高补间到满尺寸（视觉上从屏幕中心「长出来」）。这里覆盖 `init()`，
 *    让图片解码完成后直接出现在适配尺寸。
 * 3. 缩放复位：对外暴露 `snapToFit()` / `resetZoom()` / `refit()`，避免扩展层去强转调用库的 protected `normalize()`。
 * 4. 缩放状态桥接：库只把放大状态留在 `state.zoomedIn`，这里同步成根节点的 `data-vvg-zoomed`，供 CSS 让底部信息区让位。
 * 5. 沉浸适配：可用区域在常规 / 放大 / 沉浸之间切换后，按新的容器高度重新计算适配尺寸。
 * 6. 尺寸跟随：观察根节点尺寸（全屏、窗口最大化/还原、拖拽边框、旋转）变化后重新适配，重复调用幂等。
 * 7. 缩略图占位：数组模式没有任何低清层，主图解码前只能看黑屏。这里给当前图挂一层缩略图，
 *    用它按数据尺寸直接铺到最终适配位置，主图解码后淡入覆盖，再把占位层摘掉。
 */

/**
 * 创建占位层
 *
 * 外层用 div 而不是直接把 `<img>` 挂给 `thumb`：库的类型把 `thumb` 声明成 `HTMLDivElement | null`，
 * 且 `.vvw-item` 内的 div 不会被 `.vvw-item img` 那条定位规则接管，尺寸口径完全由我们掌握
 * @param thumb 缩略图地址
 */
const createPlaceholder = (thumb: string) => {
  const wrapper = document.createElement("div")
  // 刻意不用库的 .vvw-img-lo 类名：关闭态下库会强制显示它并按 --vvw-init-x/y 回缩，
  // 而数组模式这两个变量恒为 0px，会让关闭动画错位
  wrapper.className = "vvg-img-lo"

  const image = document.createElement("img")
  image.alt = ""
  image.decoding = "async"
  image.draggable = false
  image.src = thumb

  wrapper.appendChild(image)
  return wrapper
}

/** 重新适配的落点方式 */
export type RefitOptions = {
  /**
   * 是否播放补间
   * - true（默认）：沉浸切换等用户主动操作，走库的补间，容器高度同步缓动
   * - false：全屏进出、窗口尺寸变化，直接贴合新盒子
   */
  animate?: boolean
}

export class VistaImageHost extends VistaImage {
  /** 主图解码前顶住画面的缩略图层，只有当前图（pos === 0）会创建 */
  private placeholder: HTMLDivElement | null = null
  /** 占位层里的缩略图，列表没带原始尺寸时按它的自然比例校正占位尺寸 */
  private placeholderImage: HTMLImageElement | null = null
  /** 摘除占位层的定时器，0 表示当前没有挂起的摘除 */
  private placeholderTimer = 0

  constructor(params: VistaImageParams) {
    const view = params.vistaView
    const config = params.elm.config as VistaGalleryImgConfig
    const isCurrent = params.pos === 0

    // 必须在 super 之前收缩可用区域：构造完就会触发一次尺寸计算，
    // 晚一步就会先按整块视口量一次，图片会短暂压住上下两块信息区
    measureSafeArea(view.imageContainer?.parentElement ?? null)

    // 切图时库要等图片实例建好之后才把 state.zoomedIn 归零，构造时读到的是上一张的旧值。
    // 新图总是从适配尺寸开始，所以先清掉放大标记再写可用区域，避免带着上一张的让位状态起算；
    // 沉浸标记必须保留——沉浸中翻页仍然要全屏
    getRoot(view)?.toggleAttribute(ZOOM_ATTR, false)
    refreshSafeArea(view)

    // 包一层库的缩放回调：滚轮、双击、双指与缩放按钮最终都汇到 onScale，
    // 是唯一能实时拿到 isMin 的地方。库只对当前展示的那张更新 state.zoomedIn（见 vista-view 内部的 onScale），这里照做
    const onScale = params.onScale
    super({
      ...params,
      // 邻图只加载缩略图：库在 VistaImage 构造里就会把 config.src 写进 <img> 并 decode，
      // 原图给满 1 + 2×preloads 张会和当前图抢带宽与解码线程，正是打开时卡屏的主因。
      // 槽位照旧保留，只是里面装的是低清图，翻页滑动转场不受影响
      elm: { ...params.elm, config: { ...config, src: isCurrent || !config.thumb ? config.src : config.thumb } },
      onScale: (par) => {
        onScale(par)
        if (par.vistaImage.index === view.state.currentIndex) {
          syncZoomState(view, !par.isMin)
        }
      },
    })

    // 还原真实地址：元素实际加载的是上一步给的地址，而 config 要保持原图语义，
    // 否则 toObject() / onContentChange 抛给外部的 src 会变成缩略图
    this.config.src = config.src

    if (isCurrent && config.thumb && config.thumb !== config.src) {
      this.placeholder = createPlaceholder(config.thumb)
      this.placeholderImage = this.placeholder.querySelector("img")
      // 库在 getChildElements() 里会把 thumb 插到主图之前、destroy() 时一并移除，
      // 数组模式下库自己不会创建它，正好借这个槽位挂占位层，不必改库
      this.thumb = this.placeholder
    }
  }

  /**
   * 按可用区域（顶部工具栏到说明文字之间）计算适配尺寸
   * 容器高度已由 CSS 用 --vvg-safe-* 收缩，这里直接量 .vvw-item 即可
   */
  protected getFullSizeDim() {
    const rect = this.element.parentElement?.getBoundingClientRect()
    const boxWidth = rect && rect.width > 0 ? rect.width : window.innerWidth
    const boxHeight = rect && rect.height > 0 ? rect.height : window.innerHeight

    return fitIntoBox(this.element.naturalWidth, this.element.naturalHeight, boxWidth, boxHeight)
  }

  /**
   * 当前可用区域的目标盒子
   *
   * 宽度取 .vvw-item 实测（等于一个视口宽，全屏 / 窗口缩放后自动跟随）；
   * 高度按 safe-area 目标值算，避开 .vvw-image-container 那条 240ms 高度过渡。
   * 首次适配、重新适配与「是否已经适配过」的判定必须用同一套口径，
   * 抽出来避免三处各量一次导致判定与实际结果对不上。
   */
  measureBox() {
    const rect = this.element.parentElement?.getBoundingClientRect()
    const target = this.getTargetBoxHeight()

    return {
      width: rect && rect.width > 0 ? rect.width : window.innerWidth,
      height: target > 0 ? target : window.innerHeight,
    }
  }

  /**
   * 当前适配尺寸是否已经匹配给定尺寸（1px 内视为一致，避开亚像素取整误差）
   * @param width 目标宽度
   * @param height 目标高度
   */
  matchesSize(width: number, height: number) {
    return Math.abs(this.fullW - width) < 1 && Math.abs(this.fullH - height) < 1
  }

  /** 缓存的可用区域盒子，见 measureCached() */
  private cachedBox: { width: number; height: number } | null = null

  /**
   * 让可用区域盒子缓存失效
   *
   * 盒子只可能被这几件事改变：ResizeObserver（全屏、最大化、拖拽边框、DPI）、window.resize、
   * visualViewport.resize、fullscreenchange，以及沉浸切换这种同步改写安全区的高度变化。
   * 前四类都会汇到 scheduleReconcile，由它统一清缓存；沉浸切换由 refitCurrentImage 清。
   */
  invalidateBox() {
    this.cachedBox = null
  }

  /**
   * 带缓存的 measureBox()
   *
   * 收敛循环每帧都要判定「盒子变了吗」，而 measureBox() 读 getBoundingClientRect，
   * 在样式已经脏了的帧里等于每帧强制一次整页布局（实测单次全屏切换 169 次、约 33ms）。
   * 缓存只在这几种外部事件后失效，因此不会漏掉真正的尺寸变化。
   */
  measureCached() {
    this.cachedBox ??= this.measureBox()
    return this.cachedBox
  }

  /**
   * 图片当前是否已经停在适配尺寸上
   *
   * 补间动画逐帧收敛，途中 state.width 一定不等于 fullW；
   * 收敛循环靠它判断「这一轮可以收手了」，不作为重新适配的依据。
   */
  isAtFit() {
    return Math.abs(this.state.width - this.fullW) < 1 && Math.abs(this.state.height - this.fullH) < 1
  }

  /**
   * 按当前盒子算出的适配尺寸是否已经生效
   *
   * fullW / fullH 存的是**适配后的图片尺寸**，不是容器盒子尺寸，所以判定是否要重新适配时
   * 必须把盒子先过一遍 fitIntoBox 再比，直接拿盒子宽高比会永远不相等——
   * 那会让收敛循环每帧都判成「盒子变了」，持续拉满整个超时窗口
   */
  isFitForBox() {
    const box = this.measureCached()
    const { width, height } = fitIntoBox(this.element.naturalWidth, this.element.naturalHeight, box.width, box.height)

    return this.matchesSize(width, height)
  }

  /**
   * 覆盖默认初始化：解码完成后立即置为最终尺寸，跳过从 0 开始的补间
   *
   * 顺序上先铺缩略图占位、再等主图解码：
   * 1. 占位层只依赖列表里的原始尺寸，不产生任何请求，同步就能显示，打开时不再是从黑屏开始等；
   * 2. 当前图占位一上屏就放行翻页锁（IMAGE_READY_EVENT），慢网下不必等主图解码完才能翻页；
   * 3. 主图解码完成后按适配尺寸就位、淡入覆盖占位层，淡入结束再摘掉占位层。
   */
  async init() {
    this.placePlaceholder()
    // 只有真的铺上了占位层才提前放行：没有缩略图时（或邻图）画面还是空的，
    // 此时放行会让翻页节流失去意义，退回「主图就位才解锁」的原有节奏
    if (this.placeholder) this.notifyImageReady()

    try {
      await this.isLoaded
    } catch {
      // 图片加载失败时给库的样式钩子一个标记，避免抛出未捕获的 Promise 异常
      this.element.classList.add("vvw--loaderror")
      // 失败也要放行翻页锁，否则一张加载出错的图会把翻页永久锁死，只能等超时兜底。
      // 占位层刻意保留：这种情况下它就是唯一能看的内容，黑屏比低清图更糟
      this.notifyImageReady()
      // 失败同样算「有结果」，左上角 loading 不能一直转
      this.notifyImageLoaded()
      return
    }

    if (this.isCancelled) return

    // onLoad 按整块视口算过一次尺寸，这里用可用区域的结果覆盖，
    // minW 是缩小下限，必须跟着一起改，否则滚轮缩放的比例判断会错
    const box = this.measureBox()
    const { width, height } = fitIntoBox(this.element.naturalWidth, this.element.naturalHeight, box.width, box.height)
    this.fullW = width
    this.fullH = height
    this.minW = width * 0.5

    this.state.width = width
    this.state.height = height
    this.element.classList.add("vvw--loaded")
    this.element.classList.add("vvw--ready")
    this.isReady = true

    // 数组模式下库不会写这两个变量（默认恒为 0px），导致 .vvw--closing 把大图缩成一个点。
    // 补成当前适配尺寸后，关闭退化为整层淡出。
    this.element.style.setProperty("--vvw-init-w", `${width}px`)
    this.element.style.setProperty("--vvw-init-h", `${height}px`)

    this.onImageReady()

    // 新图已按适配尺寸就位，通知翻页节流可以放行下一次翻页
    this.notifyImageReady()

    // 原图已经解码完成，左上角的 loading 可以收了
    this.notifyImageLoaded()

    // 主图开始淡入，等淡入结束再摘占位层
    this.releasePlaceholder()
  }

  /**
   * 把缩略图占位层铺到最终适配位置
   *
   * 尺寸口径与主图完全一致（`measureBox()` + `fitIntoBox()`，见 getFullSizeDim），
   * 所以主图就位时不会有任何尺寸跳动，只是清晰度变化。
   * 没有占位层（邻图）或已摘除时是空操作。
   */
  private placePlaceholder() {
    const wrapper = this.placeholder
    if (!wrapper) return

    const config = this.config as VistaGalleryImgConfig

    const applySize = (width: number, height: number) => {
      // 每次重新量盒子：缺尺寸时这一步要等缩略图解码，期间容器可能已经变过（沉浸切换、窗口缩放）
      const box = this.measureBox()
      const fit = fitIntoBox(width, height, box.width, box.height)
      wrapper.style.width = `${fit.width}px`
      wrapper.style.height = `${fit.height}px`
    }

    // 列表带原始尺寸时直接算，连缩略图解码都不用等
    if (config.width && config.height) {
      applySize(config.width, config.height)
      return
    }

    // 缺尺寸：先铺满可用区域（否则宽度为 0 完全看不见），
    // 等缩略图解码拿到自然尺寸（与原图等比）再校正成适配尺寸
    const box = this.measureBox()
    wrapper.style.width = `${box.width}px`
    wrapper.style.height = `${box.height}px`

    const thumb = this.placeholderImage
    if (!thumb) return

    const correct = () => {
      if (thumb.naturalWidth > 0 && thumb.naturalHeight > 0) applySize(thumb.naturalWidth, thumb.naturalHeight)
    }
    if (thumb.complete) correct()
    else thumb.addEventListener("load", correct, { once: true })
  }

  /**
   * 延时摘除占位层
   *
   * 主图拿到 `.vvw--loaded` 后还有 200ms 的淡入，期间它仍是半透明的，
   * 立刻摘掉占位层会先露出黑底再变亮，表现为一次闪烁。
   * 重复调用是幂等的；实例被销毁时定时器仍会触发，但对已脱离文档的节点 remove() 无副作用。
   */
  private releasePlaceholder() {
    const wrapper = this.placeholder
    if (!wrapper || this.placeholderTimer) return

    this.placeholderTimer = window.setTimeout(() => {
      this.placeholderTimer = 0
      wrapper.remove()
      this.placeholder = null
      this.placeholderImage = null
      // 库的 destroy() 还会 this.thumb?.remove()，清空引用避免重复操作
      if (this.thumb === wrapper) this.thumb = null
    }, PLACEHOLDER_HOLD_MS)
  }

  /** 通知外部：当前图片已经渲染就位 */
  private notifyImageReady() {
    getRoot(this.vistaView)?.dispatchEvent(new CustomEvent(IMAGE_READY_EVENT))
  }

  /**
   * 通知外部：当前这张原图已经有结果（解码完成或加载失败）
   * 邻图不派发，见 IMAGE_LOADED_EVENT 的说明
   */
  private notifyImageLoaded() {
    if (this.pos !== 0) return
    getRoot(this.vistaView)?.dispatchEvent(new CustomEvent(IMAGE_LOADED_EVENT))
  }

  /**
   * 以图片实际中心为锚点缩放
   *
   * 库的 zoomIn / zoomOut 不传 center，会退回 initPointerCenter——那个值在构造时固定成视口中心。
   * 图片容器被上下安全区推离视口中心，按视口中心放大就「不从图片中心放大」，
   * 这里在缺省时补上图片当前所在区域的视口中心；滚轮缩放自带鼠标坐标，不受影响。
   * @param scaleFactor 缩放因子
   * @param center 缩放锚点（视口坐标），缺省时取图片所在区域中心
   * @param center.x 锚点横坐标
   * @param center.y 锚点纵坐标
   */
  animateZoom(scaleFactor: number, center?: { x: number; y: number }) {
    const anchor = center ?? this.getFitCenter()

    // 库的补偿公式依赖两个内部状态：initPointerCenter 与首次缩放时缓存的图片矩形。
    // 滚轮缩放会把 initPointerCenter 改成鼠标位置（onScroll 里的 setInitialCenter），还原后不会复原；
    // 容器尺寸变过（沉浸 / 全屏）后缓存的矩形同样过期。两者都会让「按按钮放大」带上残留偏移。
    // 回到适配态时先清掉矩形缓存，再把锚点写回 initPointerCenter，
    // 于是 scaleMove 里的 compensate 与 anchorOffset 同时归零，放大以图片中心为基准
    if (!this.vistaView.state.zoomedIn) this.resetCachedRect()
    this.setInitialCenter(anchor)

    super.animateZoom(scaleFactor, anchor)
  }

  /**
   * 缩放/捏合入口，顺带打断尚未结束的适配补间
   *
   * 适配补间（refit → resetZoom）会逐帧改写 state.width / height，而补间动画本身不响应指针事件。
   * 用户在这个窗口内放大，补间每帧都会把尺寸拉回去，表现为「第一次放大被弹回去，要放大两三次才生效」。
   * 用户操作优先级更高：先中止补间，缩放以当前尺寸为起点。
   * animateZoom 内部也是走 scaleMove，这里覆盖一处即可覆盖按钮 / 滚轮 / 双击 / 双指全部入口。
   * @param scaleFactor 缩放因子
   * @param center 缩放锚点（视口坐标）
   * @param center.x 锚点横坐标
   * @param center.y 锚点纵坐标
   * @param animate 是否带动画
   */
  scaleMove(scaleFactor: number, center?: { x: number; y: number }, animate?: boolean) {
    VistaHiresTransition.stop(this)

    super.scaleMove(scaleFactor, center, animate)
  }

  /**
   * 清掉库缓存的基准矩形
   *
   * 库用 `this.rect ||= getBoundingClientRect()` 只取一次（private，没有公开的替代手段）。
   * 只在适配态清空：此时重新取到的就是居中适配的矩形，恰好等于缩放锚点；
   * 放大态下 element 的矩形已经带着缩放，清空反而会把基准弄错。
   */
  private resetCachedRect() {
    const target = this as unknown as { rect: DOMRect | null }
    target.rect = null
  }

  /** 当前图片所在区域的视口中心 */
  private getFitCenter() {
    const rect = this.element.parentElement?.getBoundingClientRect()
    if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  /** 立即还原到适配尺寸，并同步视图级缩放状态 */
  snapToFit() {
    // 「还原大小」补间跑到一半就切全屏时，旧补间下一帧还会继续写 state.width/height，
    // 把刚贴好的尺寸覆盖回去。这里先停掉，保证贴合结果是最终结果
    VistaHiresTransition.stop(this)
    this.normalize()
    // 缩到下限时库会把图片压成半透明，复位后必须跟着清掉，否则整图一直在半透明状态
    this.state.lessThanMinWidth = false
    // resetZoom 走 VistaHiresTransition 直接改尺寸，不一定经过 onScale，这里补一次；
    // normalize 已经可能触发过回调，重复写属性是幂等的
    syncZoomState(this.vistaView, false)
    syncZoomReset(this.vistaView)
  }

  /**
   * 带过渡地还原到适配尺寸
   * 补间目标与库自身的 animateNormalize 保持一致，保证落点与正常归位相同
   */
  resetZoom() {
    if (!this.isReady) {
      this.snapToFit()
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      VistaHiresTransition.start({
        vistaImage: this,
        target: {
          width: this.fullW,
          height: this.fullH,
          translate: { x: 0, y: 0 },
          transform: { x: 0, y: 0, scale: 1 },
        },
        onComplete: () => {
          // normalize 本身不触发 onContentChange，缩放下标必须在这里手动复位
          this.snapToFit()
          resolve()
        },
        shouldWait: () => false,
      })
    })
  }

  /**
   * 按当前可用区域重新适配当前图片
   *
   * 两条路径共用同一套盒子计算，区别只在落点方式：
   * - 沉浸切换（animate 默认 true）走库的补间，容器高度同步缓动，观感更连贯；
   * - 全屏进出、窗口尺寸变化（animate false）直接贴合新尺寸。
   *   库的补间是「每帧走剩余距离 20%」的固定步进，天然只有 5~8 帧，
   *   结果一多主线程掉帧就会退化成两三个可见台阶，所以尺寸类变化不能走它。
   * 若图片正处于放大状态，两条路径同样会复位缩放——这里要的就是「整图匹配容器」这个确定状态。
   * 重复调用是幂等的：尺寸没变且图片已在适配态时直接返回。
   * @param options 落点方式
   */
  refit(options: RefitOptions = {}) {
    const animate = options.animate ?? true

    // 还没解码完成时退出：init() 会在解码后按当时的盒子直接就位。
    // 提前 normalize 会把尺寸写成库按整块视口算出的中途值。
    // 但占位层是此刻唯一可见的内容，容器变了要跟着重新对位，否则沉浸切换后它和最终位置错开
    if (!this.isReady) {
      this.placePlaceholder()
      return Promise.resolve()
    }

    // refit 一定会把图片复位到适配尺寸，所以先清掉放大标记并刷新可用区域。
    // 否则「沉浸中放大过再退出沉浸」时，会按放大让位（底部不占位）的高度量出一个偏大的适配尺寸，
    // 恢复底部栏后图片就会超出容器被裁
    syncZoomState(this.vistaView, false)

    // 高度按目标安全区计算，不能直接量 .vvw-image-container：
    // 沉浸切换期间它有 240ms 高度过渡，此刻读到的还是过渡起始值
    const box = this.measureCached()
    const { width, height } = fitIntoBox(this.element.naturalWidth, this.element.naturalHeight, box.width, box.height)

    // 尺寸观察器、resize、fullscreenchange 都会汇到这里，同一时刻可能连着来好几次。
    // 尺寸没变、图片也没被放大时不做任何事，避免把正在进行的补间动画无意义地重启动
    if (this.matchesSize(width, height) && this.isAtFit()) {
      return Promise.resolve()
    }

    // 已经确定要重新适配：缩放状态立刻复位，工具栏按钮不必等补间结束才更新。
    // 补间本身要几百毫秒，期间按钮若还停在「可还原」状态，用户会以为缩放没被复位
    syncZoomReset(this.vistaView)

    this.fullW = width
    this.fullH = height
    this.minW = width * 0.5

    // 关闭动画会缩回这两个尺寸，必须跟着更新，否则会缩到一个已经不对的矩形
    this.element.style.setProperty("--vvw-init-w", `${width}px`)
    this.element.style.setProperty("--vvw-init-h", `${height}px`)

    if (!animate) {
      this.snapToFit()
      // 复位缩放时可能刚打开过容器缓动，尺寸类变化下容器也必须瞬时到位
      closeFitTransition(getRoot(this.vistaView))
      return Promise.resolve()
    }

    return this.resetZoom()
  }

  /**
   * 按目标占位算可用高度，不受 .vvw-image-container 高度过渡影响
   */
  private getTargetBoxHeight() {
    const root = getRoot(this.vistaView)
    const container = this.vistaView.imageContainer?.parentElement
    if (!root || !container) return window.innerHeight

    const { top, bottom } = readAreaInsets(root, container)
    return Math.max(0, root.clientHeight - top - bottom)
  }
}

/**
 * 按当前可用区域重新适配正在展示的图片，**带补间**
 *
 * 只给沉浸切换这类用户主动操作用；全屏进出、窗口尺寸变化走 reconcileStep 的瞬时贴合。
 * 只处理当前 index 的那一张：预载的其他图片会在各自 init() 时按当时的容器尺寸重新测量。
 * @param vistaView 画廊实例
 */
export const refitCurrentImage = (vistaView: VistaView) => {
  const current = vistaView.state.children.images.find((image) => image instanceof VistaImageHost && image.index === vistaView.state.currentIndex)
  if (!(current instanceof VistaImageHost)) return Promise.resolve()

  // 调用方（沉浸切换）刚刚同步改过安全区，缓存里的盒子已经过期
  current.invalidateBox()
  return current.refit({ animate: true })
}

/** 当前绑定尺寸观察的画廊实例 */
let watchedView: VistaView | null = null
/** 根节点尺寸观察器：全屏、窗口最大化/还原、拖拽边框、旋转、DPI 变化都会改变根节点尺寸 */
let boxObserver: ResizeObserver | null = null
/** 已挂起的收敛帧，0 表示当前没有在收敛 */
let reconcileFrame = 0
/** 本轮收敛的起始时间，用于超时兜底 */
let reconcileStart = 0
/** 目标盒子连续稳定的帧数 */
let stableFrames = 0

/** 一轮收敛最多持续多久（毫秒），超时直接落位，避免循环常驻 */
const RECONCILE_MAX_MS = 1500
/** 目标盒子连续多少帧不变才算布局落定 */
const STABLE_FRAMES = 2

/**
 * 取当前展示的图片宿主
 *
 * 只认 currentIndex 那一张：预载的其他图片会在各自 init() 时按当时的容器尺寸重新测量。
 * @param vistaView 画廊实例
 */
const getCurrentHost = (vistaView: VistaView) => {
  const image = vistaView.state.children.images.find((item) => item instanceof VistaImageHost && item.index === vistaView.state.currentIndex)

  return image instanceof VistaImageHost ? image : null
}

/**
 * 收敛循环的一帧
 *
 * 退出全屏这类场景里，`fullscreenchange` / `resize` / ResizeObserver 的触发时机都可能早于视口真正落定，
 * 只按事件调一次 refit 会量到旧盒子、被幂等判定挡掉，然后就再没机会了。
 * 这里换成「按最终盒子反复对账」：每帧采样一次盒子，变了就按新盒子适配，
 * 盒子稳定且图片已落在适配尺寸上才收手，超时则直接落位兜底。
 */
const reconcileStep = () => {
  reconcileFrame = 0

  const view = watchedView
  if (!view) return

  const host = getCurrentHost(view)
  // 切图过程中图片实例可能已被替换，交给下一次触发的循环处理
  if (!host) return
  // 尚未解码完成：init() 会按当时的盒子直接就位，这里不需要干预
  if (!host.isReady) return

  // 盒子变了要重算；处于放大态也要重算——全屏进出属于「按默认方式匹配容器」的场景，
  // 缩放必须一起复位，否则按钮会停在「还能继续还原」的旧状态上。
  // 这里全是尺寸类变化，一律瞬时贴合：库的补间只有 5~8 帧，掉帧就会变成可见台阶
  if (!host.isFitForBox() || view.state.zoomedIn) {
    // 重新开始累计稳定帧，等布局落定
    stableFrames = 0
    void host.refit({ animate: false })
  } else {
    stableFrames += 1
  }

  if (stableFrames >= STABLE_FRAMES && host.isAtFit()) return

  if (performance.now() - reconcileStart > RECONCILE_MAX_MS) {
    // 兜底：补间被反复打断或始终没落位时，直接写死到适配尺寸，保证最终状态一定正确。
    // 用户已经手动放大过就不再抢他的缩放状态，否则会把刚放大的图强行弹回适配尺寸
    if (!view.state.zoomedIn) host.snapToFit()
    return
  }

  reconcileFrame = requestAnimationFrame(reconcileStep)
}

/**
 * 触发一轮尺寸收敛
 *
 * ResizeObserver、window.resize、visualViewport.resize、fullscreenchange 全部汇到这里。
 * 同一时刻只跑一个循环：全屏与窗口缩放落定阶段会连着抛多个事件，逐个 refit 会把补间动画反复打断。
 */
export const scheduleReconcile = () => {
  if (reconcileFrame) return

  // 尺寸类事件到达：本轮收敛必须重新量一次盒子，见 measureCached()
  if (watchedView) getCurrentHost(watchedView)?.invalidateBox()

  reconcileStart = performance.now()
  stableFrames = 0
  reconcileFrame = requestAnimationFrame(reconcileStep)
}

/** 停止观察，并取消正在跑的收敛（画廊关闭时调用，避免回调打到已销毁的实例上） */
export const unwatchFitBox = () => {
  // 根节点即将被移除，别让清理回调打到已销毁的节点上
  window.clearTimeout(fitTransitionTimer)
  fitTransitionTimer = 0

  if (reconcileFrame) {
    cancelAnimationFrame(reconcileFrame)
    reconcileFrame = 0
  }

  boxObserver?.disconnect()
  boxObserver = null
  window.removeEventListener("resize", scheduleReconcile)
  // WebView2 / Android WebView 上视口变化不一定派发 window.resize，可视视口补一路
  window.visualViewport?.removeEventListener("resize", scheduleReconcile)
  document.removeEventListener("fullscreenchange", scheduleReconcile)
  watchedView = null
}

/**
 * 开始观察画廊的可用区域尺寸
 *
 * 只监听 fullscreenchange 有两个漏口：
 * 1. 该事件常常早于视口真正 resize 触发，此刻量到的仍是旧尺寸，算出的适配结果与当前一致，等于没适配；
 * 2. Tauri 窗口最大化 / 还原、拖拽边框、DPI 变化、移动端旋转根本不会派发这个事件。
 * 因此事件只作为「开始收敛」的信号，真正的判定交给 reconcileStep 逐帧对账。
 * @param vistaView 画廊实例
 */
export const watchFitBox = (vistaView: VistaView) => {
  unwatchFitBox()
  watchedView = vistaView

  const root = getRoot(vistaView)
  if (!root) return

  boxObserver = new ResizeObserver(scheduleReconcile)
  boxObserver.observe(root)
  window.addEventListener("resize", scheduleReconcile)
  window.visualViewport?.addEventListener("resize", scheduleReconcile)
  document.addEventListener("fullscreenchange", scheduleReconcile)
}
