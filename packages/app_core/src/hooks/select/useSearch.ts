import { storeToRefs } from "pinia"
import { onMounted, onUnmounted } from "vue"
import { toast } from "vue-sonner"

import useSelect from "@app/core/hooks/select/useSelect"
import useWallpaperSelect from "@app/core/hooks/select/useWallpaperSelect"
import useWallpaper from "@app/core/hooks/useWallpaper"
import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"
import { WallpaperSort } from "@app/core/types/wallpaper"

/** 根据筛选项查询壁纸相关的hook */
export default function () {
  const { options } = useSelect()
  const wallpaperStore = useWallpaperStore()
  const { panelInfo, searchResult, isWallpaperSelecting } = storeToRefs(wallpaperStore)

  const containerRef = useTemplateRef<HTMLDivElement>("containerRef")
  //  imageBoxRef 绑定的是组件实例而不是 DOM 元素了
  const imageBoxRef = useTemplateRef<ComponentPublicInstance>("imageBoxRef")
  const searchBoxRef = useTemplateRef<ComponentPublicInstance>("searchBoxRef")

  /** 是否显示筛选框 */
  const hideOptions = ref(false)
  /** 搜索标志，表示搜索状态 */
  const isSearching = ref(false)
  /** 搜索标志，表示显示搜索结果 */
  const showResult = ref(false)

  /** 容器已滚动的高度 */
  const scrollY = ref(0)
  /** 搜索选项框的高度 */
  const searchBoxHeight = ref(0)

  const stats = computed(() => {
    const { wallpaper_count, role_count, version_count } = panelInfo.value
    return [
      { value: wallpaper_count, label: "壁纸数量", key: "wallpaper_count" },
      { value: role_count, label: "角色数量", key: "role_count" },
      { value: version_count, label: "版本数量", key: "version_count" },
    ]
  })

  const search = async () => {
    if (isWallpaperSelecting) useWallpaperSelect().cancelSelection()
    isSearching.value = true
    try {
      const { version, role, sort, ...restData } = options.get()
      const params = {
        version: version?.map((item) => Number(item.value)),
        role: role?.map((item) => Number(item.value)),
        sort: sort === WallpaperSort.pc || sort === WallpaperSort.phone ? sort : undefined,
        ...restData,
      }
      if (!params) return
      const res = await useWallpaper().search({ ...params, type: "diff" })
      if (res) {
        searchResult.value = res.wallpaper_list
        console.log("搜索结果：", searchResult.value)

        if (res.total === 0) {
          toast.info("搜索结果为空")
          return
        }
        showResult.value = true

        if (searchResult.value) {
          const imageBox = imageBoxRef.value?.$el

          // 等待元素变换才能移动
          await nextTick()

          if (imageBox && containerRef.value) {
            containerRef.value.scrollTo({
              top: imageBox.offsetTop - searchBoxHeight.value,
              behavior: "smooth",
            })
          }
          // 隐藏筛选项
          hideOptions.value = true
        }
      }
    } catch (error) {
      console.error("搜索壁纸时发生错误：", error)
      toast.error("搜索壁纸时发生错误，请稍后再试")
    } finally {
      isSearching.value = false
    }
  }

  /** 显示/隐藏筛选项 */
  const toggleOptionVisible = async () => {
    hideOptions.value = !hideOptions.value
  }

  const clearResult = () => {
    if (isWallpaperSelecting) useWallpaperSelect().cancelSelection()
    searchResult.value = []
    showResult.value = false
    hideOptions.value = false
  }

  const backToTop = async () => {
    if (searchResult.value) {
      // 等待元素变换才能移动
      await nextTick()
      containerRef.value?.scroll({ behavior: "smooth", top: 0 })
    }
  }

  const updateScrollData = () => {
    if (!containerRef.value) return

    // 获取最新滚动位置
    scrollY.value = containerRef.value.scrollTop
    // 重置标记，允许下一帧继续计算
    listener.ticking = false
  }

  const handleScroll = () => {
    // 如果上一帧的计算还没执行完，直接忽略这次滚动事件
    if (!listener.ticking) {
      window.requestAnimationFrame(updateScrollData)
      listener.ticking = true
    }
  }

  const listener = {
    ticking: false, // 标记当前是否正在等待下一帧
    add: () => {
      containerRef.value?.addEventListener("scroll", handleScroll)
    },
    remove: () => {
      containerRef.value?.removeEventListener("scroll", handleScroll)
    },
  }

  const heightListener: {
    observer: ResizeObserver | null
    start: () => void
    stop: () => void
  } = {
    observer: null,
    start: () => {
      const el = searchBoxRef.value?.$el
      if (!el) return

      heightListener.observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.contentRect.height
          searchBoxHeight.value = height
          // console.log("searchBox 当前高度：", height)
        }
      })

      heightListener.observer.observe(el)
    },
    stop: () => {
      heightListener.observer?.disconnect()
    },
  }

  onMounted(() => {
    listener.add()
    heightListener.start()
  })

  onUnmounted(() => {
    listener.remove()
    heightListener.stop()
  })

  return {
    stats,
    isSearching,
    result: searchResult,
    hideOptions,
    showResult,
    scrollY,
    searchBoxHeight,
    search,
    toggleOptionVisible,
    clearResult,
    backToTop,
  }
}
