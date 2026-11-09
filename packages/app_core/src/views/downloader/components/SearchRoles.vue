<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon, RefreshCw, RotateCcw, Ellipsis, ChevronLeft } from "@lucide/vue"

import useRoleSelect from "@app/core/hooks/select/useRole"
import { Button } from "@shadcn/ui/button"

const { isAdvanced, roleSelect, roleOptions, init, refresh, reset } = useRoleSelect()

/** 解决移动端每次选择都会弹出输入框 */
const isFocus = ref(false)

onMounted(() => {
  init()
})
</script>

<template>
  <div>
    <div class="flex justify-between">
      <Label class="mb-2 text-sm">角色({{ roleOptions.length }})</Label>
      <ButtonGroup class="ml-auto">
        <Button class="px-1 md:px-2" title="刷新" variant="ghost" size="sm" @click="refresh()"><RefreshCw /></Button>
        <Button class="px-1 md:px-2" title="重置" variant="ghost" size="sm" @click="reset()"><RotateCcw /></Button>
        <Button
          :title="(isAdvanced ? '收起' : '展开') + '高级筛选'"
          variant="ghost"
          size="sm"
          class="ml-auto px-1 md:px-2"
          @click="isAdvanced = !isAdvanced"
          ><ChevronLeft v-if="isAdvanced" /><Ellipsis v-else /></Button
      ></ButtonGroup>
    </div>
    <Combobox v-model="roleSelect" multiple by="label">
      <ComboboxAnchor as-child>
        <ComboboxTrigger as-child>
          <Button variant="outline" class="w-full justify-between">
            <span class="truncate">
              {{ roleSelect.length > 0 ? roleSelect.map((item) => item.label).join(", ") : "不限" }}
            </span>
            <ChevronsUpDownIcon class="opacity-50" />
          </Button>
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxList align="start">
        <ComboboxInput :inputmode="isFocus ? null : 'none'" placeholder="搜索角色..." @click="isFocus = true" @blur="isFocus = false" />
        <ComboboxViewport class="max-h-60">
          <ComboboxEmpty>找不到该角色</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxItem v-for="item in roleOptions" :key="item.value" :value="item">
              {{ item.label }}
              <ComboboxItemIndicator>
                <CheckIcon />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
      </ComboboxList>
    </Combobox>
  </div>
</template>
