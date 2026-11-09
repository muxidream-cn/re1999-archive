<script lang="ts" setup>
import { computed } from "vue"

import { useSpiderConfig } from "@app/core/adapters/spider"
import VirtualWaterfall from "@app/core/components/custom/imageBox/VistaWaterfall.vue"
import useSearch from "@app/core/hooks/select/useSearch"
import useDevice from "@app/core/hooks/useDevice"
import ConvergedSearch from "@app/core/views/downloader/components/ConvergedSearch.vue"
import SearchControls from "@app/core/views/downloader/components/SearchControls.vue"
import SearchOptions from "@app/core/views/downloader/components/SearchOptions.vue"
import Spider from "@app/core/views/downloader/components/Spider.vue"

const { stats, isSearching, result, hideOptions, showResult, scrollY, searchBoxHeight, search, toggleOptionVisible, clearResult, backToTop } =
  useSearch()

const { isMobile } = useDevice()
const spiderConfig = useSpiderConfig()

/** 按当前设备取蜘蛛缩放 */
const spiderScale = computed(() => (isMobile.value ? spiderConfig.scale.mobile : spiderConfig.scale.desktop))

/** 按当前设备取蜘蛛定位，未提供移动变体时回退桌面值 */
const spiderPosition = computed(() => {
  const position = isMobile.value ? (spiderConfig.position.mobile ?? spiderConfig.position.desktop) : spiderConfig.position.desktop
  return { right: position.right, top: position.top }
})
</script>

<template>
  <div ref="containerRef" class="main-container relative h-full w-full">
    <h1 class="title mo_h1 mo_claire pt-6">Re:1999 Archive</h1>
    <h2 class="mo_h3 mo_ma">收录自《 重返未来：1999 》官网</h2>
    <h2 class="mo_h3 mo_ma"><span class="mo_mo_kudry">By</span> 默默的尸体</h2>

    <!-- 蜘蛛(返回顶部) -->
    <Spider class="spider" :style="spiderPosition" :scale="spiderScale" :target-height="scrollY" @to-top="backToTop" />
    <!-- <ImageCardTemplate /> -->

    <!-- 数据版 -->
    <div class="mx-auto grid max-w-120 grid-cols-3 gap-4">
      <div v-for="item in stats" :key="item.label" class="p-4 text-center">
        <div class="text-xl font-bold md:text-3xl">{{ item.value }}</div>

        <div class="text-nowrap">{{ item.label }}</div>
      </div>
    </div>

    <!-- 融合搜索框 -->
    <ConvergedSearch />

    <!-- 筛选壁纸 -->
    <Card ref="searchBoxRef" class="sticky top-0 z-10 p-4">
      <SearchControls
        :is-searching="isSearching"
        :result="result"
        :hide-options="hideOptions"
        @clear-result="clearResult"
        @toggle-option-visible="toggleOptionVisible"
        @search="search"
      />

      <Separator v-if="!hideOptions" class="md:my-2" />
      <div v-if="!hideOptions" v-motion-slide-bottom>
        <SearchOptions ref="searchRef" />
      </div>
    </Card>
    <Separator v-show="result.length" class="my-2 md:my-4" />

    <!-- 壁纸展示 -->
    <VirtualWaterfall
      ref="imageBoxRef"
      :list="result"
      :search-box-height="searchBoxHeight"
      :show-result="showResult"
      :class="result.length ? 'min-h-full' : 'h-0'"
    />
  </div>
</template>

<style scoped>
.main-container {
  scrollbar-gutter: stable; /* 始终预留滚动条的空间 */
  overflow-x: hidden;
  overflow-y: auto;
  /* 隐藏滚动条 */
  /* scrollbar-width: none;
  -ms-overflow-style: none; */
}
</style>
