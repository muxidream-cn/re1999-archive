<script setup lang="ts">
import { SearchIcon, Download, SquareMousePointer, SquareDashedMousePointer, ChevronsUpDown, ChevronsDownUp, X, Loader } from "@lucide/vue"

import useWallpaperSelect from "@app/core/hooks/select/useWallpaperSelect"
import useDevice from "@app/core/hooks/useDevice"
import { Button } from "@shadcn/ui/button"
import { Label } from "@shadcn/ui/label"

import type { Wallpaper_list } from "@app/core/apis/wallpaper/type"

const { isWallpaperSelecting, selectedWallpaperIds, isDownloading, startSelection, cancelSelection, selectAll, invertSelected, downloadSelected } =
  useWallpaperSelect()

const { isMobile } = useDevice()

const btnSize = computed(() => (isMobile.value ? "lg" : "hg"))

const props = defineProps({
  /** 搜索状态 */
  isSearching: {
    type: Boolean,
    required: true,
  },
  /** 搜索结果数据 */
  result: {
    type: Array as PropType<Wallpaper_list[]>,
    required: true,
  },
  /** 是否隐藏选项区 */
  hideOptions: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  /** 清空搜索结果 */
  (e: "clear-result"): void
  /** 切换选项区可见性；不传参则默认取反，传参则以传入值为准 */
  (e: "toggle-option-visible", visible?: boolean): void
  /** 触发搜索 */
  (e: "search"): void
}>()

/** 显示下载按钮 */
const showSearchBtn = computed(() => {
  return !props.hideOptions || props.result.length === 0
})
</script>

<template>
  <div class="inline-flex h-4 items-center justify-between md:h-8">
    <Label class="text-xl font-bold md:text-2xl">筛选</Label>
    <div class="flex items-center gap-2">
      <template v-if="result.length">
        <ButtonGroup>
          <Button v-if="!isWallpaperSelecting" :size="btnSize" title="批量选择" @click="startSelection"> <SquareDashedMousePointer /> 选择 </Button>
          <template v-else>
            <Button :size="btnSize" title="清空选择" @click="cancelSelection"> <X /> 取消 </Button>
            <!-- <Button :size="btnSize" :disabled="isSelectAll" title="全部选择" @click="selectAll"> <SquareMousePointer /> 全选 </Button> -->
            <Button :size="btnSize" title="反向选择" @click="invertSelected"> <SquareMousePointer /> 反选 </Button>
          </template>
          <Button :size="btnSize" title="下载" :disabled="isDownloading" @click="downloadSelected">
            <Download /> 下载 <span v-if="selectedWallpaperIds.size">({{ selectedWallpaperIds.size }})</span>
          </Button>
        </ButtonGroup>
      </template>
      <Button v-if="showSearchBtn" :size="btnSize" title="搜索" :disabled="props.isSearching" @click="emit('search')">
        <Loader v-if="props.isSearching" /> <SearchIcon v-else /> 搜索
      </Button>
      <Button :size="`icon-${btnSize}`" variant="ghost" :title="hideOptions ? '展开筛选项' : '隐藏筛选项'" @click="emit('toggle-option-visible')">
        <ChevronsUpDown v-if="hideOptions" />
        <ChevronsDownUp v-else />
      </Button>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
