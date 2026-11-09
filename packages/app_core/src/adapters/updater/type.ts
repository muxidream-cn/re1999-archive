import type { AppCheckResponse } from "@app/core/apis/app/type"

export interface UpdateDownloadEvent {
  type: "started" | "progress" | "finished"
  contentLength?: number
  chunkLength?: number
}

export interface AppUpdater<TUpdate = unknown> {
  /**
   * 检查更新
   */
  check(): Promise<TUpdate | null>

  /**
   * 获取当前版本
   */
  getCurrentVersion(update: TUpdate): string

  /**
   * 获取更新信息
   */
  getUpdateInfo(update: TUpdate): AppCheckResponse

  /**
   * 下载更新
   */
  download(update: TUpdate, callback?: (event: UpdateDownloadEvent) => void): Promise<void>

  /**
   * 下载并安装
   */
  downloadAndInstall(update: TUpdate, callback?: (event: UpdateDownloadEvent) => void): Promise<void>

  /**
   * 安装更新
   */
  install(update: TUpdate): Promise<void>

  /**
   * 重启应用
   */
  relaunch(): Promise<void>

  /**
   * 关闭更新
   */
  close?(update: TUpdate): Promise<void> | void

  /**
   * 可选：更新包是否已就绪（命中缓存时可直接安装，跳过下载阶段）
   */
  isPackageReady?(update: TUpdate): Promise<boolean>

  /**
   * 可选：平台提供的备用下载入口（如 Android 用浏览器打开下载链接）
   */
  openDownloadLink?(update: TUpdate): Promise<void>
}
