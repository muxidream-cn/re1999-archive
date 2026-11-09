<template>
  <div ref="searchRef" class="relative">
    <InputGroup
      class="my-2 h-10 w-auto max-w-full md:mx-auto md:my-4 md:max-w-140"
      :class="{
        'rounded-b-none': showSearchResult,
      }"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <InputGroupAddon>
              <InputGroupButton variant="secondary" aria-label="Help" size="icon-xs">
                <HelpCircle />
              </InputGroupButton>
            </InputGroupAddon>
          </TooltipTrigger>

          <TooltipContent side="top">
            <p>输入可检索搜索条件，<br />选择标签添加搜索条件</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <InputGroupInput v-model.lazy.trim="inputValue" placeholder="输入角色名、版本名、标签..." @focus="isInputFocused = true" />

      <InputGroupAddon align="inline-end">
        <InputGroupButton v-show="inputValue.length" variant="ghost" class="rounded-full" size="sm" @click="inputValue = ''">
          <X />
        </InputGroupButton>
        <InputGroupButton variant="secondary" size="sm" :disabled="isSearching" @click="fetchSearch(inputValue)">
          <LoaderIcon v-if="isSearching" class="animate-spin" />
          <SearchIcon v-else />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>

    <!-- 搜索结果 -->
    <div
      v-if="showSearchResult"
      class="bg-background absolute top-full left-1/2 z-50 box-content max-h-75 w-[calc(100%-2rem)] max-w-full -translate-x-1/2 overflow-y-scroll rounded-b-md border-2 shadow-lg md:w-140"
    >
      <!-- 搜索中 -->
      <div v-if="isSearching" class="text-muted-foreground flex items-center justify-center gap-2 px-4 py-6 text-sm">
        <LoaderIcon class="size-4 animate-spin" />
        <span>正在搜索...</span>
      </div>

      <!-- 有搜索结果 -->
      <template v-else-if="hasSearchResult">
        <!-- 角色 -->
        <div v-if="resList.roles?.length">
          <!-- <div class="bg-muted/30 text-muted-foreground border-b px-4 py-2 text-xs font-medium">角色</div> -->

          <div class="p-1">
            <button
              v-for="role in resList.roles"
              :key="role.id"
              type="button"
              :class="{
                'bg-emerald-800': selected.role(role.id),
              }"
              class="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              @click="toggle.role(role.id)"
            >
              <div class="min-w-0">
                <div class="truncate select-text" v-html="highlightKeyword(role.name)" />

                <div v-if="role.tags" class="text-muted-foreground mt-0.5 truncate text-xs select-text" v-html="highlightKeyword(role.tags)" />
              </div>

              <span class="shrink-0 rounded-md bg-amber-600 px-2 py-0.5 text-xs"> 角色 </span>
            </button>
          </div>
        </div>

        <!-- 版本 -->
        <div
          v-if="resList.versions?.length"
          :class="{
            'border-t': resList.roles?.length,
          }"
        >
          <!-- <div class="bg-muted/30 text-muted-foreground border-b px-4 py-2 text-xs font-medium">版本</div> -->

          <div class="p-1">
            <button
              v-for="version in resList.versions"
              :key="version.version"
              type="button"
              :class="{
                'bg-emerald-800': selected.version(version.version),
              }"
              class="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              @click="toggle.version(version.version)"
            >
              <div class="min-w-0">
                <div class="truncate" v-html="highlightKeyword(version.name)" />

                <div v-if="version.group_name" class="text-muted-foreground mt-0.5 truncate text-xs" v-html="highlightKeyword(version.group_name)" />
              </div>

              <span class="text-secondary-foreground shrink-0 rounded-md bg-cyan-800 px-2 py-0.5 text-xs"> 版本 </span>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="text-muted-foreground px-4 py-8 text-center text-sm">未检索到相关内容</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HelpCircle, LoaderIcon, SearchIcon, X } from "@lucide/vue"

import useSearchOptions from "@app/core/hooks/select/useSearchOptions"
import useSelect from "@app/core/hooks/select/useSelect"

const { isSearching, isInputFocused, inputValue, resList, showSearchResult, hasSearchResult, fetchSearch, highlightKeyword } = useSearchOptions()
const { selected, toggle } = useSelect()

const searchRef = ref<HTMLElement>()

/**监听点击事件。鼠标没移出该组件则不关闭搜索结果 */
const handleClickOutside = (e: MouseEvent) => {
  if (!searchRef.value?.contains(e.target as Node)) {
    isInputFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside)
})
</script>

<style scoped></style>
