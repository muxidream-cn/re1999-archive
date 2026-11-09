import { useDebounceFn } from "@vueuse/core"
import { toast } from "vue-sonner"

import { KeyWordSearchResponse } from "@app/core/apis/wallpaper/type"
import useWallpaper from "@app/core/hooks/useWallpaper"

/** 根据关键词查询壁纸的筛选项相关的hook */
export default function () {
  const { searchByKeyword } = useWallpaper()

  const isSearching = ref(false)
  const isInputFocused = ref(false)
  const inputValue = ref("")
  const oldSearchValue = ref("")

  const resList = ref<KeyWordSearchResponse>({
    roles: [],
    versions: [],
  })

  /** 显示搜索结果组件 */
  const showSearchResult = computed(() => {
    return inputValue.value.length > 0 && isInputFocused.value
  })

  /** 是否有搜索结果 */
  const hasSearchResult = computed(() => {
    return resList.value.roles.length > 0 || resList.value.versions.length > 0
  })

  /**关键词搜索 */
  const fetchSearch = async (val: string) => {
    if (val === "") return
    else if (oldSearchValue.value === val) {
      toast.info("已显示搜索结果")
      return
    } else if (!val) {
      resList.value = {
        roles: [],
        versions: [],
      }
      return
    }

    isSearching.value = true

    try {
      console.log("发起搜索请求:", val)

      const res = await searchByKeyword(val, "inaccurate")

      if (res) {
        resList.value = {
          roles: res.roles ?? [],
          versions: res.versions ?? [],
        }
      }
    } finally {
      isSearching.value = false
      oldSearchValue.value = val
    }
  }

  /**高亮匹配的关键词 */
  const highlightKeyword = (text: string) => {
    if (!inputValue.value) return text

    const keyword = inputValue.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    return text.replace(new RegExp(`(${keyword})`, "gi"), '<mark class="bg-green-400 rounded-sm px-0.5">$1</mark>')
  }

  const debouncedFetch = useDebounceFn(fetchSearch, 750)

  watch(inputValue, (newVal) => {
    isSearching.value = !!newVal

    debouncedFetch(newVal)
  })

  return { isSearching, isInputFocused, inputValue, resList, showSearchResult, hasSearchResult, fetchSearch, highlightKeyword }
}
