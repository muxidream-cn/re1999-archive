<script setup lang="ts">
import { Loader, RefreshCcw } from "@lucide/vue"
import { toast } from "vue-sonner"

import { useUpdater } from "@app/core/adapters/updater/useUpdater"
import useSettings from "@app/core/hooks/useSettings"
import { Badge } from "@shadcn/ui/badge"
import { Button } from "@shadcn/ui/button"
import { Separator } from "@shadcn/ui/separator"
import { Switch } from "@shadcn/ui/switch"

const currentVersion: string = import.meta.env.VITE_APP_VERSION

const settings = useSettings()

/** 自动检查更新：与安卓 / PC 端 UpdateDialog 的启动判断共用同一设置项 */
const autoCheck = computed({
  get: () => settings.getValue("update.autoCheck"),
  set: (value: boolean) => settings.setValue("update.autoCheck", value),
})

/** 正在检查 */
const checking = ref(false)

const checkUpdate = async () => {
  // 与共享 UpdateDialog 拿同一份控制器：有更新时自动弹窗，手动检查不受「启动时检查更新」开关影响
  const controller = useUpdater()
  if (!controller) {
    toast.info("当前平台暂不支持检查更新")
    return
  }

  checking.value = true
  try {
    const hasUpdate = await controller.checkForUpdate()
    if (!hasUpdate) toast.success("当前已是最新版本")
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "检查更新失败")
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-6 py-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm">启动时检查更新</span>
      </div>
      <Switch v-model="autoCheck" />
    </div>

    <Separator />

    <div class="flex items-center justify-between gap-6 py-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm">当前版本（V{{ currentVersion }}）</span>
      </div>
      <Button variant="outline" size="sm" :disabled="checking" @click="checkUpdate">
        <Loader v-if="checking" class="h-4 w-4 animate-spin" />
        <RefreshCcw v-else class="h-4 w-4" />
        {{ checking ? "检查中..." : "检查更新" }}
      </Button>
    </div>
  </div>
</template>
