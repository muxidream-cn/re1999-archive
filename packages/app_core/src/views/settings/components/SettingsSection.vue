<script setup lang="ts">
import SettingsField from "@app/core/views/settings/components/SettingsField.vue"
import { Card, CardContent, CardHeader, CardTitle } from "@shadcn/ui/card"

import type { SettingsSectionConfig } from "@app/core/views/settings/types"

defineProps<{
  section: SettingsSectionConfig
}>()
</script>

<template>
  <!-- id 作为锚点，scroll-mt 预留滚动定位的顶部余量 -->
  <div :id="section.id" class="scroll-mt-4">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg">
          <component :is="section.icon" v-if="section.icon" class="text-muted-foreground h-4 w-4" />
          <span>{{ section.title }}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <!-- 通用字段：schema 驱动渲染 -->
        <div v-if="section.fields?.length" class="divide-y">
          <SettingsField v-for="field in section.fields" :key="field.key" :field="field" />
        </div>

        <!-- 自定义区块：公告 / 检查更新 / 关于 等 -->
        <component :is="section.component" v-else-if="section.component" v-bind="section.componentProps" />
      </CardContent>
    </Card>
  </div>
</template>
