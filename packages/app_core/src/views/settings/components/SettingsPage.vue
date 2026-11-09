<script setup lang="ts">
import { watchDebounced } from "@vueuse/core"

import useScrollSpy from "@app/core/hooks/useScrollSpy"
import SettingsSection from "@app/core/views/settings/components/SettingsSection.vue"
import { visibleSections } from "@app/core/views/settings/config"

const route = useRoute()
const router = useRouter()

/** 可见分区的锚点 id */
const sectionIds = computed(() => visibleSections.map((section) => section.id))

/** 内容滚动容器 + 锚点滚动 / 高亮跟随 */
const scrollRef = ref<HTMLElement | null>(null)
const { activeId, scrollTo } = useScrollSpy(scrollRef, sectionIds, 48)

/** 最近一次由页面自身写入 url 的分区（用于忽略自己触发的 url 变化） */
let lastSelfSynced: string | null = null

/**
 * 按 url 上的 section 参数滚动到对应分区
 * @param behavior 滚动行为，默认平滑
 */
const locateFromQuery = (behavior: ScrollBehavior = "smooth") => {
  const target = route.query.section
  if (typeof target === "string" && sectionIds.value.includes(target)) {
    scrollTo(target, behavior)
  }
}

/**
 * 把当前分区写回 url，保证全局侧边栏的高亮与内容一致
 * @param id 分区锚点 id
 */
const syncSectionToQuery = (id: string) => {
  lastSelfSynced = id
  router.replace({ path: route.path, query: { ...route.query, section: id } })
}

watchDebounced(
  activeId,
  (id) => {
    if (!id || route.query.section === id) return
    syncSectionToQuery(id)
  },
  { debounce: 250 }
)

watch(
  () => route.query.section,
  (target) => {
    // 自己回写的 url 不再触发二次滚动，避免打断用户的滚动位置
    if (target === lastSelfSynced) {
      lastSelfSynced = null
      return
    }
    if (typeof target === "string") locateFromQuery()
  }
)

onMounted(() => {
  // 首次进入：无 section 参数时默认落在第一个分区（同时让侧边栏首项高亮）
  const target = route.query.section
  if (typeof target !== "string" || !sectionIds.value.includes(target)) {
    const first = sectionIds.value[0]
    if (first) syncSectionToQuery(first)
  } else {
    locateFromQuery("auto")
  }
  // 设置值的启动应用（组件透明度 / 容器颜色写入 CSS 变量）已统一由 App.vue 的 applyStartupSettings() 完成
})
</script>

<template>
  <div ref="scrollRef" class="settings-page mx-auto h-full w-full overflow-y-auto p-1 pb-8">
    <div class="flex flex-col gap-4">
      <SettingsSection v-for="section in visibleSections" :key="section.id" :section="section" />
    </div>
  </div>
</template>
