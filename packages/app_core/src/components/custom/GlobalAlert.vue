<script setup lang="ts">
import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "@lucide/vue"
import { type PropType } from "vue"

import { Alert, AlertDescription, AlertTitle } from "@shadcn/ui/alert"
import { Button } from "@shadcn/ui/button"
import { ButtonGroup } from "@shadcn/ui/button-group"

// import { useAlert } from "@app/core/hooks/useAlert"
// const { alertMessages, hide } = useAlert()
// useAlert 还没有提出来
export type AlertType = "success" | "warning" | "error" | "info"
export interface AlertMessage {
  id: number
  title: string
  description?: string
  type?: AlertType
  icon?: string // 如果不传，会根据 type 自动使用 IconMap 中的图标
  duration?: number
  closable?: boolean
  action?: { label: string; onClick: () => void }
}
defineProps({
  alertMessages: {
    type: Array as PropType<AlertMessage[]>,
    required: true,
  },
  hide: {
    type: Function as PropType<(id: number) => void>,
    required: true,
  },
})
</script>

<template>
  <div class="pointer-events-none fixed top-0 left-1/2 z-9999 flex w-full max-w-md -translate-x-1/2 flex-col items-center p-[2vh]">
    <TransitionGroup name="alert-list" tag="div" class="flex w-full flex-col items-center gap-[1.5vh]">
      <Alert v-for="msg in alertMessages" :key="msg.id" :class="[msg.type ?? '', 'pointer-events-auto relative w-full shadow-lg']">
        <!-- 渲染图标 -->
        <!-- <i v-if="msg.icon" :class="[msg.icon, 'mr-2 h-4 w-4']"></i> -->
        <AlertCircleIcon />
        <AlertTitle>{{ msg.title }}</AlertTitle>
        <AlertDescription v-if="msg.description">{{ msg.description }}</AlertDescription>

        <!-- 渲染附加操作按钮 -->
        <ButtonGroup>
          <Button v-if="msg.action" class="text-xs font-medium underline hover:no-underline" @click="msg.action!.onClick">
            {{ msg.action.label }}
          </Button>
          <!-- 手动关闭按钮 -->
          <Button v-if="msg.closable" class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="hide(msg.id)">✕</Button>
        </ButtonGroup>

        <!-- 手动关闭按钮 -->
        <!-- <Button v-if="msg.closable" class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="hide(msg.id)">✕</Button> -->
      </Alert>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 根据不同的 type 设置边框或背景色（以 shadcn-vue 为例） 
.success {
  border-color: #22c55e;
  background-color: #f0fdf4;
}
.warning {
  border-color: #eab308;
  background-color: #fefce8;
}
.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}
.info {
  border-color: #3b82f6;
  background-color: #eff6ff;
}
*/
/* 动画配置 */
.alert-list-enter-active {
  transition: all 0.4s ease-out;
}
.alert-list-leave-active {
  transition: all 0.3s ease-in;
}
.alert-list-enter-from,
.alert-list-leave-to {
  opacity: 0;
  transform: translateY(-2vh);
}
.alert-list-move {
  transition: transform 0.3s ease;
}
</style>
