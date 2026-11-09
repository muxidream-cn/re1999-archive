<script setup lang="ts">
import useSettings from "@app/core/hooks/useSettings"
import { Badge } from "@shadcn/ui/badge"
import { Separator } from "@shadcn/ui/separator"
import { Switch } from "@shadcn/ui/switch"

defineProps<{
  announcements: {
    id: number
    date: string
    title: string
    content: string
  }[]
}>()

const settings = useSettings()

/** 是否接收公告通知 */
const notify = computed({
  get: () => settings.getValue("announcement.notify"),
  set: (value: boolean) => settings.setValue("announcement.notify", value),
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-6 pb-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm">接收公告通知</span>
        <p class="text-muted-foreground text-xs">开启后将在启动时展示最新公告（Mock）</p>
      </div>
      <Switch v-model="notify" />
    </div>

    <Separator />

    <ul class="flex flex-col">
      <li v-for="item in announcements" :key="item.id" class="flex flex-col gap-1 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">{{ item.title }}</span>
          <Badge variant="secondary" class="text-muted-foreground ml-auto text-[10px] font-normal">{{ item.date }}</Badge>
        </div>
        <p class="text-muted-foreground text-xs leading-relaxed">{{ item.content }}</p>
      </li>
    </ul>
  </div>
</template>
