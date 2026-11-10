<script setup lang="ts">
import { ExternalLink } from "@lucide/vue"

import ThirdPartyNotices from "@app/core/views/settings/components/ThirdPartyNotices.vue"
import { Badge } from "@shadcn/ui/badge"
import { Button } from "@shadcn/ui/button"
import { Separator } from "@shadcn/ui/separator"

import type { AboutAppInfo } from "@app/core/views/settings/types"

const props = defineProps<{
  appInfo: AboutAppInfo
  openUrl: (url: string) => void
}>()

const visibleLinks = computed(() => props.appInfo.links.filter((link) => !link.hide))
</script>

<template>
  <div class="flex flex-col gap-4 text-left">
    <!-- 应用信息 -->
    <div class="flex items-center gap-4">
      <img class="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl" src="/favicon.webp" />
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="text-base font-medium">{{ appInfo.name }}</span>
          <Badge variant="secondary">V{{ appInfo.version }}</Badge>
        </div>
        <p class="text-muted-foreground text-xs">{{ appInfo.description }}</p>
        <p class="text-muted-foreground text-xs">本软件是基于 MIT 许可证的免费开源软件，第三方组件仍按其各自的许可证授权。</p>
      </div>
    </div>

    <Separator />

    <!-- 外部链接：项目地址 / 网站地址 / 隐私协议，由配置驱动 -->
    <template v-for="link in visibleLinks" :key="link.label">
      <div class="flex items-center justify-between gap-6">
        <span class="text-sm">{{ link.label }}</span>
        <Button variant="outline" size="sm" @click="openUrl(link.url)">
          <ExternalLink class="h-4 w-4" />
          浏览器打开
        </Button>
      </div>
      <Separator />
    </template>

    <!-- 第三方开源组件声明：折叠子区块，不新增设置分区与侧栏导航项 -->
    <ThirdPartyNotices :open-url="openUrl" />

    <p class="text-muted-foreground text-center text-xs">{{ appInfo.copyright }}</p>
  </div>
</template>
