<script setup lang="ts">
// * 瀑布流方案
// 当前方案：https://github.com/lhlyu/vue-virtual-waterfall/blob/main/README.zh.md
// 其他方案：https://juejin.cn/post/7327971289743278121
// 画廊改为 VistaView，瀑布流本身不做任何改动
import { VirtualWaterfall } from "@lhlyu/vue-virtual-waterfall"
import { storeToRefs } from "pinia"
import "vistaview/style.css"

import useWallpaperSelect from "@app/core/hooks/select/useWallpaperSelect"
import useImageDownload from "@app/core/hooks/useImageDownload"
import useRole from "@app/core/hooks/useRole"
import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"
import { formatWallpaperPreviewSrc } from "@app/core/utils/wallpaper"
import Controls from "@app/core/views/downloader/components/imageBox/Controls.vue"
import ImageCard from "@app/core/views/downloader/components/imageBox/ImageCard.vue"
import ResultCount from "@app/core/views/downloader/components/imageBox/ResultCount.vue"

import { useVistaGallery } from "./vista/useVistaGallery"
import "./vista/vista-theme.css"

import type { Wallpaper_list } from "@app/core/apis/wallpaper/type"

const props = defineProps({
  list: {
    type: Array as PropType<Wallpaper_list[]>,
    required: true,
  },
  showResult: {
    type: Boolean,
    default: false,
  },
  searchBoxHeight: {
    type: Number,
    required: true,
  },
})

const { getRoleNameListByIds } = useRole()
const { customDownload } = useImageDownload()
const wallpaperStore = useWallpaperStore()
const { waterFallSetting, currentColumnCount, isWallpaperSelecting, isDownloading } = storeToRefs(wallpaperStore)
const { toggleSelection, isSelected } = useWallpaperSelect()

const waterfallContainer = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const observeWaterfallContainer = (element: HTMLElement | null) => {
  resizeObserver?.disconnect()
  if (!element) {
    containerWidth.value = 0
    return
  }

  resizeObserver?.observe(element)
  containerWidth.value = element.getBoundingClientRect().width
}

// #region 虚拟化的前提条件
//
// 库的可见窗口是用「content.parentElement.clientHeight」当视口高度算的：
//   S = 内容顶 - 1 * clientHeight，M = 内容顶 + 2 * clientHeight
// content 是库的根节点（height = 全部条目总高），它的父节点就是这个容器 div。
// 容器一旦没有高度约束，clientHeight 就等于内容总高，窗口会把整张列表全覆盖，
// 结果就是 DOM 里始终有全部条目（上千张卡片），虚拟化形同虚设。
// 所以这里把容器钉成滚动视口高，再用等高占位把页面总高还回去，布局与滚动范围都不变。
const rootRef = ref<HTMLElement | null>(null)
/** 滚动视口高度，即库期望的「一屏」高度 */
const viewportHeight = ref(0)
/** 瀑布流内容总高（库根节点的 border-box 高），用于等高占位 */
const waterfallContentHeight = ref(0)

let viewportObserver: ResizeObserver | null = null
let contentObserver: ResizeObserver | null = null
let scrollParent: HTMLElement | null = null

/** 占位高度：内容超出视口的那部分，补上后页面总高与改动前一致 */
const spacerHeight = computed(() => Math.max(0, waterfallContentHeight.value - viewportHeight.value))

/**
 * 向上找最近的可滚动祖先
 * @param element 起始元素
 */
const findScrollParent = (element: HTMLElement | null) => {
  let current = element?.parentElement ?? null
  while (current) {
    const { overflowY } = getComputedStyle(current)
    if (overflowY === "auto" || overflowY === "scroll") return current
    current = current.parentElement
  }
  return null
}

/**
 * 跟踪滚动视口高度
 * @param element 组件根节点，用于定位滚动祖先
 */
const observeViewport = (element: HTMLElement | null) => {
  viewportObserver?.disconnect()
  if (!element) {
    viewportHeight.value = 0
    return
  }

  scrollParent = findScrollParent(element)
  // 没有可滚动祖先时（页面滚动在 document 上），退回文档视口
  const target = scrollParent ?? document.documentElement

  viewportObserver = new ResizeObserver(() => {
    viewportHeight.value = target.clientHeight
  })
  viewportObserver.observe(target)
  viewportHeight.value = target.clientHeight
}

/**
 * 跟踪瀑布流内容总高（库根节点）
 * @param element 容器节点，其第一个子节点就是库的根节点
 */
const observeWaterfallContent = (element: HTMLElement | null) => {
  contentObserver?.disconnect()

  const content = element?.firstElementChild
  if (!(content instanceof HTMLElement)) {
    waterfallContentHeight.value = 0
    return
  }

  contentObserver = new ResizeObserver(() => {
    waterfallContentHeight.value = content.offsetHeight
  })
  contentObserver.observe(content)
  waterfallContentHeight.value = content.offsetHeight
}
// #endregion

const calculatedColumnCount = computed(() => {
  if (waterFallSetting.value.itemMinWidth === 0) {
    return waterFallSetting.value.maxColumnCount
  }

  const contentWidth = containerWidth.value - waterFallSetting.value.padding * 2
  if (contentWidth <= 0) return null
  if (contentWidth < waterFallSetting.value.itemMinWidth * 2) {
    return waterFallSetting.value.minColumnCount
  }

  const columnCount = Math.floor(contentWidth / waterFallSetting.value.itemMinWidth)
  return Math.min(columnCount, waterFallSetting.value.maxColumnCount)
})

watch(
  calculatedColumnCount,
  (columnCount) => {
    if (columnCount !== null && currentColumnCount.value !== columnCount) {
      currentColumnCount.value = columnCount
    }
  },
  { immediate: true, flush: "sync" }
)

watch(waterfallContainer, observeWaterfallContainer, { flush: "post" })
// 列表清空后整个子树会被卸载，占位高度要跟着归零，否则页面会残留一段空白
watch(waterfallContainer, observeWaterfallContent, { flush: "post" })

const loadedImages = reactive(new Set<string>())

const getImageKey = (item: Wallpaper_list) => {
  return `${item.id}-${item.img_url}`
}

const isImageLoaded = (item: Wallpaper_list) => {
  return loadedImages.has(getImageKey(item))
}

const handleImageLoad = (item: Wallpaper_list) => {
  loadedImages.add(getImageKey(item))
}

const calcItemHeight = (item: Wallpaper_list, itemWidth: number) => {
  if (!item.width || !item.height) {
    return 250
  }

  return (itemWidth * item.height) / item.width
}

//#region 画廊相关
/**
 * 说明文字：优先角色名，其次昵称，最后退回壁纸名
 * @param item 壁纸信息
 */
const getCaption = (item: Wallpaper_list) => {
  const roleNames = getRoleNameListByIds(item.role_ids).join(",")
  if (roleNames) return roleNames
  return (item as { nick_name?: string }).nick_name || item.name
}

/**
 * 缩略图地址：与卡片 webp 预览图使用同一套规则
 * @param item 壁纸信息
 */
const getThumb = (item: Wallpaper_list) => formatWallpaperPreviewSrc(item.img_path)

/**
 * 下载当前壁纸，沿用既有下载流程（进度提示、取消、Web 端卸载保护）
 * @param item 壁纸信息
 */
const downloadItem = (item: Wallpaper_list) => {
  void customDownload([{ name: item.name, url: item.img_url, path: item.img_path }])
}

// 画廊只消费 props.list 这一份数据，源地址、说明文字、缩略图、下载字段都按索引现算；
// 移动端判断由 useVistaGallery 内部走 useDevice，这里不再注入
const gallery = useVistaGallery({
  list: computed(() => props.list),
  isDownloading,
  getCaption,
  getThumb,
  download: downloadItem,
})

// 下载中/结束后刷新工具栏按钮禁用态
watch(isDownloading, () => gallery.sync())

/**
 * 点击卡片：选择模式下切换勾选，否则打开画廊
 * @param item 壁纸信息
 * @param index 在列表中的索引
 * @param event 点击事件，选择模式下需要阻止默认行为
 */
const handleWallpaperClick = (item: Wallpaper_list, index: number, event: MouseEvent) => {
  if (isDownloading.value) return
  if (isWallpaperSelecting.value) {
    event.preventDefault()
    event.stopPropagation()
    toggleSelection(item.id)
    return
  }
  gallery.open(index)
}

onMounted(() => {
  resizeObserver = new ResizeObserver((entries) => {
    containerWidth.value = entries[0]?.contentRect.width ?? 0
  })
  observeWaterfallContainer(waterfallContainer.value)
  observeWaterfallContent(waterfallContainer.value)
  // 根节点始终存在，先把视口高量出来，避免首屏按「容器无高度约束」渲染一次全量列表
  observeViewport(rootRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  viewportObserver?.disconnect()
  contentObserver?.disconnect()
})
// #endregion
</script>

<template>
  <div ref="rootRef" class="flex flex-col">
    <Controls v-if="props.list.length" class="sticky z-10" :style="{ top: searchBoxHeight + 36 + 'px', height: '30px' }" />

    <div v-if="props.list.length" class="wallpaper-waterfall flex-1">
      <!--
        容器高度 = 滚动视口高：这是库计算可见窗口的前提（它拿 content.parentElement.clientHeight 当一屏）；
        未测量到时（viewportHeight 为 0）不写高度，行为退回改动前，绝不能把页面搞坏。
        注意这里不能加 overflow，离屏卡片要靠溢出参与 .main-container 的可滚动区域，裁掉就滚不动了
      -->
      <div ref="waterfallContainer" :style="viewportHeight ? { height: `${viewportHeight}px` } : undefined">
        <VirtualWaterfall
          :items="props.list"
          row-key="id"
          :enable-cache="false"
          :gap="10"
          :padding="waterFallSetting.padding"
          :item-min-width="waterFallSetting.itemMinWidth"
          :max-column-count="waterFallSetting.maxColumnCount"
          :min-column-count="waterFallSetting.minColumnCount"
          :preload-screen-count="[1, 1]"
          :calc-item-height="calcItemHeight"
        >
          <!-- 瀑布流子项 -->
          <!--
            v-memo：容器尺寸变化时瀑布流会重算全部几何项并重渲染可见列表，
            卡片本身的数据没变，没必要跟着 patch（点击回调闭包捕获 index，故一并纳入依赖）
          -->
          <template #default="{ item, index }: { item: Wallpaper_list; index: number }">
            <ImageCard
              v-memo="[item, index, isWallpaperSelecting, isSelected(item.id)]"
              class="card"
              :image="item"
              :loaded="isImageLoaded"
              :selecting="isWallpaperSelecting"
              :selected="isSelected(item.id)"
              @click="handleWallpaperClick(item, index, $event)"
              @load="handleImageLoad(item)"
            />
          </template>
        </VirtualWaterfall>
      </div>

      <!--
        等高占位：容器钉成视口高后，瀑布流内容不再撑开父级。
        补上「内容总高 - 视口高」，页面总高与 ResultCount 的位置就和改动前完全一致；
        溢出的内容本身也会计入滚动区域，两者底部重合，不会出现双倍高度
      -->
      <div v-if="spacerHeight" class="waterfall-spacer" aria-hidden="true" :style="{ height: `${spacerHeight}px` }" />
    </div>

    <ResultCount v-if="showResult" :total="list.length" />
  </div>
</template>

<style scoped>
.wallpaper-waterfall {
  width: 100%;
  height: 100%;
}

.card {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  padding: 0.5rem;
}

.card img {
  display: block;
  width: 100%;
  height: auto;
}

.skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}
</style>
