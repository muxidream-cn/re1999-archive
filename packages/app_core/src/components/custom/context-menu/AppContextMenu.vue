<script setup lang="ts">
import { ContextMenuTrigger } from "reka-ui"
import { onMounted, onUnmounted, ref, shallowRef } from "vue"
import { toast } from "vue-sonner"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@shadcn/ui/context-menu"

import { contextGroupLabel, resolveContext, type ContextTarget } from "./contextMenuConfig"
import { useContextActions, type ContextActionItem, type ContextMenuGroupItem } from "./useContextActions"

const { resolveMenuGroups } = useContextActions()

/** 菜单是否展示，受控模式用于拦截 data-context-menu="none" 区域 */
const open = ref(false)
/** 本次右键的上下文快照，动作执行时读取 */
const context = shallowRef<ContextTarget | null>(null)
const menuGroups = shallowRef<ContextMenuGroupItem[]>([])

/**
 * 捕获阶段解析右键上下文
 *
 * 必须早于 reka 的 trigger 处理：菜单内容要在打开前准备好，
 * 否则受控模式下会先弹出上一次的内容。
 * @param event
 */
const handleContextMenuCapture = (event: MouseEvent) => {
  const target = resolveContext(event.target)
  context.value = target
  menuGroups.value = target.disabled ? [] : resolveMenuGroups(target)
}

/**
 * 受控打开：命中禁用区域或没有任何可用分组时不弹菜单
 * @param value
 */
const handleOpenChange = (value: boolean) => {
  if (value && !menuGroups.value.length) return
  open.value = value
}

/**
 * 当前动作是否可用，不可用项渲染为禁用态
 * @param item
 */
const isDisabled = (item: ContextActionItem) => {
  const target = context.value
  return Boolean(target && item.enabled && !item.enabled(target))
}

const runAction = (item: ContextActionItem) => {
  const target = context.value
  if (!target || isDisabled(item)) return

  Promise.resolve(item.run(target)).catch((error) => {
    console.error("右键菜单动作执行失败", error)
    toast.error("操作失败，请稍后重试")
  })
}

onMounted(() => {
  document.addEventListener("contextmenu", handleContextMenuCapture, { capture: true })
})

onUnmounted(() => {
  document.removeEventListener("contextmenu", handleContextMenuCapture, { capture: true })
})
</script>

<template>
  <!-- 不使用 @shadcn/ui 的 ContextMenuTrigger：它写死 select-none，会让全站文字不可选 -->
  <ContextMenu :open="open" :modal="false" @update:open="handleOpenChange">
    <ContextMenuTrigger as-child>
      <div class="min-h-dvh">
        <slot />
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="min-w-52">
      <template v-for="(group, index) in menuGroups" :key="group.group">
        <ContextMenuSeparator v-if="index > 0" />
        <ContextMenuGroup>
          <ContextMenuLabel v-if="menuGroups.length > 1">
            {{ contextGroupLabel[group.group] }}
          </ContextMenuLabel>
          <ContextMenuItem v-for="item in group.items" :key="item.id" :disabled="isDisabled(item)" @select="runAction(item)">
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
            <ContextMenuShortcut v-if="item.shortcut">{{ item.shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
