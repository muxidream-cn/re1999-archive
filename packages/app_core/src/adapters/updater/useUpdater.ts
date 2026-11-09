import { computed, reactive, ref } from "vue"
import { toast } from "vue-sonner"

import { getUpdater } from "./index"

import type { AppUpdater, UpdateDownloadEvent } from "./type"
import type { AppCheckResponse } from "@app/core/apis/app/type"

/** 更新流程状态 */
export const UpdateStatus = {
  /** 检查中 */
  checking: 0,
  /** 已检查 */
  checked: 1,
  /** 下载中 */
  downloading: 2,
  /** 已下载 */
  downloaded: 3,
} as const

/** 更新流程状态的取值联合（键与值不同，不能用 keyof typeof 代替） */
type UpdateStatusValue = (typeof UpdateStatus)[keyof typeof UpdateStatus]

/** 空白更新信息，避免对话框首帧读到 undefined */
const emptyUpdateInfo = (): AppCheckResponse => ({
  force_update: false,
  hash: "",
  notes: "",
  pub_date: "",
  signature: "",
  size: 0,
  url: "",
  version: "",
})

const createController = (updater: AppUpdater) => {
  let update: unknown | null = null

  /** 更新对话框是否展示 */
  const isDialogOpen = ref(false)

  /** 当前应用版本，构建期由 VITE_APP_VERSION 注入 */
  const currentVersion = ref<string>(import.meta.env.VITE_APP_VERSION)

  /** 服务端返回的更新信息 */
  const updateInfo = ref<AppCheckResponse>(emptyUpdateInfo())

  /** 当前更新流程状态 */
  const updateStatus = ref<UpdateStatusValue>(UpdateStatus.checking)

  /** 已下载字节数与总大小；contentLength 为 0 表示平台未提供分片进度 */
  const downloadStatus = reactive({
    downloaded: 0,
    contentLength: 0,
  })

  /** 连续下载失败次数，达到上限时提示使用平台备用下载入口 */
  const downloadFailureCount = ref(0)
  const maxDownloadAttempts = 3

  const downloadProgress = computed(() => {
    if (downloadStatus.downloaded === 0 || downloadStatus.contentLength === 0) return 0
    const progress = (downloadStatus.downloaded * 100) / downloadStatus.contentLength
    return Math.min(100, Math.round(progress))
  })

  const isLoading = computed(() => updateStatus.value === UpdateStatus.downloading)

  const canOpenDownloadLink = computed(() => typeof updater.openDownloadLink === "function")

  /** 检查更新；发现新版本时打开共享更新对话框 */
  const checkForUpdate = async () => {
    updateStatus.value = UpdateStatus.checking
    downloadFailureCount.value = 0
    downloadStatus.downloaded = 0
    downloadStatus.contentLength = 0

    update = await updater.check()
    if (!update) {
      updateStatus.value = UpdateStatus.checked
      return false
    }

    currentVersion.value = updater.getCurrentVersion(update)
    updateInfo.value = updater.getUpdateInfo(update)

    // 命中缓存的安装包可直接安装，跳过下载阶段；探测失败时降级为正常下载，不影响检查本身
    let packageReady = false
    try {
      packageReady = (await updater.isPackageReady?.(update)) ?? false
    } catch (error) {
      console.warn("检查更新包缓存失败", error instanceof Error ? error.message : "未知错误")
    }
    updateStatus.value = packageReady ? UpdateStatus.downloaded : UpdateStatus.checked
    isDialogOpen.value = true
    return true
  }

  /**
   * 下载事件
   * @param event 下载进度事件
   * @param event.type 事件类型
   * @param event.contentLength 总字节数
   * @param event.chunkLength 本次分片字节数
   */
  const handleDownloadEvent = (event: UpdateDownloadEvent) => {
    switch (event.type) {
      case "started":
        updateStatus.value = UpdateStatus.downloading
        downloadStatus.downloaded = 0
        downloadStatus.contentLength = event.contentLength ?? 0
        break

      case "progress":
        downloadStatus.downloaded += event.chunkLength ?? 0
        break

      case "finished":
        updateStatus.value = UpdateStatus.downloaded
        toast.success("下载完成")
        break
    }
  }

  /**
   * 下载更新
   * @param force true 下载→安装→重启；false 下载后等待手动安装
   */
  const updateApp = async (force = false) => {
    if (!update) {
      toast.warning("未检测到更新信息")
      return
    }

    try {
      toast.info("开始更新")
      if (force) {
        await updater.downloadAndInstall(update, handleDownloadEvent)
        await updater.relaunch()
        isDialogOpen.value = false
      } else {
        await updater.download(update, handleDownloadEvent)
      }
      downloadFailureCount.value = 0
    } catch (error) {
      // 失败后回到可重试状态，避免按钮永久卡在「下载中」
      downloadFailureCount.value += 1
      updateStatus.value = UpdateStatus.checked
      toast.error(error instanceof Error ? error.message : "更新失败，请重试")
    }
  }

  /** 安装并重启；无应用内重启能力的平台（Android）由系统安装器接管，只需关闭对话框 */
  const installApp = async () => {
    if (!update) {
      toast.warning("未检测到更新信息")
      return
    }

    try {
      await updater.install(update)
      await updater.relaunch()
      isDialogOpen.value = false
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "安装失败，请重试")
    }
  }

  /** 平台提供的备用下载入口 */
  const openDownloadLink = async () => {
    if (!update || !updater.openDownloadLink) return
    try {
      await updater.openDownloadLink(update)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "打开下载链接失败")
    }
  }

  /** 取消更新 */
  const cancel = async () => {
    if (!update) return
    await updater.close?.(update)
  }

  return {
    UpdateStatus,
    isDialogOpen,
    currentVersion,
    updateInfo,
    updateStatus,
    downloadStatus,
    downloadProgress,
    isLoading,
    downloadFailureCount,
    maxDownloadAttempts,
    canOpenDownloadLink,
    checkForUpdate,
    updateApp,
    installApp,
    openDownloadLink,
    cancel,
  }
}

type UpdaterController = ReturnType<typeof createController>

let controller: UpdaterController | null = null
let boundUpdater: AppUpdater | null = null

/**
 * 获取全局唯一的更新控制器：设置页与共享更新对话框必须拿到同一份状态，
 * 手动点击「检查更新」才能直接驱动弹窗。未配置 adapter 的平台返回 null。
 */
export const useUpdater = () => {
  const updater = getUpdater()
  if (!updater) return null
  // adapter 被重新配置（HMR / 换端）时重建控制器
  if (controller && boundUpdater === updater) return controller
  boundUpdater = updater
  controller = createController(updater)
  return controller
}
