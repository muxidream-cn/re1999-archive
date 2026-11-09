<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon, RefreshCw, RotateCcw } from "@lucide/vue"

import useVersionSelect from "@app/core/hooks/select/useVersion"
import { Button } from "@shadcn/ui/button"
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
  ComboboxViewport,
} from "@shadcn/ui/combobox"

const { versionSelect, versionOptions, init, refresh, reset } = useVersionSelect()

/** 解决移动端每次选择都会弹出输入框 */
const isFocus = ref(false)

onMounted(() => {
  init()
})
</script>

<template>
  <div>
    <div class="flex justify-between">
      <Label class="mb-2 text-sm">版本({{ versionOptions.reduce((a, b) => a + b.group.length, 0) }})</Label>
      <ButtonGroup class="ml-auto">
        <Button class="px-1 md:px-2" title="刷新" variant="ghost" size="sm" @click="refresh()"><RefreshCw /></Button>
        <Button class="px-1 md:px-2" title="重置" variant="ghost" size="sm" @click="reset()"><RotateCcw /></Button
      ></ButtonGroup>
    </div>
    <Combobox v-model="versionSelect" multiple by="label">
      <ComboboxAnchor as-child>
        <ComboboxTrigger as-child>
          <Button variant="outline" class="flex w-full justify-start overflow-hidden">
            <span class="truncate">
              {{ versionSelect.length > 0 ? versionSelect.map((item) => item.label).join(", ") : "不限" }}
            </span>
            <ChevronsUpDownIcon class="text-muted-foreground ml-auto shrink-0 opacity-50" />
          </Button>
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxList align="start">
        <ComboboxInput :inputmode="isFocus ? null : 'none'" placeholder="搜索版本..." @click="isFocus = true" @blur="isFocus = false" />
        <ComboboxViewport class="max-h-60">
          <ComboboxEmpty>找不到该版本</ComboboxEmpty>
          <ComboboxGroup v-for="optionItem in versionOptions" :key="optionItem.label" :heading="optionItem.label">
            <ComboboxItem v-for="groupItem in optionItem.group" :key="groupItem.value" :value="groupItem">
              {{ groupItem.label }}
              <ComboboxItemIndicator>
                <CheckIcon />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
        <!-- <ComboboxSeparator /> 
        <ComboboxGroup class="bg-popover">
          <ComboboxItem :value="null">
            <PlusCircleIcon />
            查找
          </ComboboxItem>
        </ComboboxGroup> -->
      </ComboboxList>
    </Combobox>
  </div>
</template>
