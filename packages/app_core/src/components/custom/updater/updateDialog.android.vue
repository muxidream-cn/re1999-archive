<script setup lang="ts">
import { Loader } from "@lucide/vue"
import dayjs from "dayjs"

import { UpdateStatus, useUpdater } from "@app/core/adapters/updater/useUpdater"
import { formatByte } from "@app/core/utils/download"
import { Button } from "@shadcn/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@shadcn/ui/dialog"
import { ScrollArea } from "@shadcn/ui/scroll-area"
import { Separator } from "@shadcn/ui/separator"

const controller = useUpdater()
if (!controller) throw new Error("updateDialog.android 需要平台先通过 configureUpdater 配置更新适配器")

// 解构成顶层 ref，模板才能自动解包；与设置页共用同一份控制器状态
const {
  isDialogOpen,
  currentVersion,
  updateInfo,
  updateStatus,
  isLoading,
  downloadFailureCount,
  maxDownloadAttempts,
  canOpenDownloadLink,
  updateApp,
  installApp,
  openDownloadLink,
  cancel,
} = controller
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogContent :show-close-button="false" class="max-w-80 text-sm" @pointer-down-outside.prevent @escape-key-down.prevent>
      <DialogHeader class="text-center">
        <DialogTitle class="text-lg">发现新版本</DialogTitle>
        <Separator />
      </DialogHeader>
      <DialogDescription class="text-start">
        <div class="flex justify-between">
          <div class="font-bold"><span class="text-sm">最新版本：</span>{{ updateInfo.version }}</div>
          <div><span class="text-sm">当前版本：</span>{{ currentVersion }}</div>
        </div>
        <div><span class="text-sm">发布时间：</span>{{ dayjs(updateInfo.pub_date).format("YY-MM-DD HH:mm:ss") }}</div>
        <div><span class="text-sm">包体大小：</span>{{ formatByte(updateInfo.size, "MB") }}</div>
      </DialogDescription>
      <div class="grid gap-2">
        <!-- 系统下载未暴露分片进度，用文字态避免一直显示 0% -->
        <div v-if="updateStatus === UpdateStatus.downloading">
          <DialogDescription aria-live="polite">正在下载并校验更新安装包…</DialogDescription>
        </div>
        <ScrollArea class="max-h-20">
          <DialogDescription class="text-sm">更新说明：</DialogDescription>
          <DialogDescription v-if="updateInfo.force_update" class="text-amber-300">* 本次更新为强制更新</DialogDescription>
          <DialogDescription
            ><div class="whitespace-pre">{{ updateInfo.notes.replace(/\\n/g, "\n") }}</div></DialogDescription
          >
        </ScrollArea>
      </div>
      <DialogDescription v-if="downloadFailureCount > 0" class="text-destructive" aria-live="polite">
        下载失败 {{ downloadFailureCount }} 次，可重试或使用其他下载方式。
      </DialogDescription>
      <DialogFooter class="flex-wrap gap-2">
        <!-- 多次下载失败后提供浏览器下载入口；安卓端只有 http/https 会被放行 -->
        <Button
          v-if="canOpenDownloadLink && downloadFailureCount >= maxDownloadAttempts"
          variant="outline"
          :disabled="isLoading"
          @click="openDownloadLink()"
        >
          浏览器下载
        </Button>
        <template v-if="updateStatus === UpdateStatus.downloaded">
          <DialogClose v-if="!updateInfo.force_update" as-child>
            <Button variant="outline" @click="cancel()">取消安装</Button>
          </DialogClose>
          <!-- 由系统安装器接管，不再有应用内重启 -->
          <Button @click="installApp()">安装</Button>
        </template>
        <template v-else>
          <template v-if="!updateInfo.force_update">
            <DialogClose as-child>
              <Button variant="outline" :disabled="isLoading" @click="cancel()">取消更新</Button>
            </DialogClose>
            <Button :disabled="isLoading" @click="updateApp()"><Loader v-if="isLoading" class="animate-spin" /> 下载</Button>
          </template>
          <Button :disabled="isLoading" @click="updateApp(true)"><Loader v-if="isLoading" class="animate-spin" /> 一键更新</Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
