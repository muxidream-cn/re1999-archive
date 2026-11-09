import { api_app_check } from "@app/core/apis/app"
import { openUrl } from "@tauri-apps/plugin-opener"
import semver from "semver"
import { toast } from "vue-sonner"

import { clearAndroidUpdateCache, hasCachedAndroidUpdate, installAndroidUpdate, prepareAndroidUpdate } from "@/services/androidUpdate"

import type { AppUpdater, UpdateDownloadEvent } from "@app/core/adapters/updater"
import type { AppCheckResponse } from "@app/core/apis/app/type"

const platform = "android"
const arch = "x86_64"
const currentVersion: string = import.meta.env.VITE_APP_VERSION

/** 无可用更新时清理旧安装包；系统安装器正在使用时保留缓存 */
const noUpdate = async (): Promise<null> => {
  if (!(await clearAndroidUpdateCache())) {
    toast.info("系统安装器正在使用更新包，暂不清理缓存")
  }
  return null
}

/**
 * 准备更新包：复用缓存或重新下载并校验 MD5
 * @param update 更新信息
 * @param callback 下载进度回调
 */
const downloadPackage = async (update: AppCheckResponse, callback?: (event: UpdateDownloadEvent) => void) => {
  // Rust 侧下载未暴露分片进度，不传 contentLength，让对话框显示文字态而非 0% 进度条
  callback?.({ type: "started" })
  // 失败时不派发 finished，由控制器把状态恢复为可重试
  await prepareAndroidUpdate(update)
  callback?.({ type: "finished" })
}

/**
 * 打开更新包下载链接（仅允许 HTTP / HTTPS）
 * @param update 更新信息
 */
const openUpdateDownloadLink = async (update: AppCheckResponse) => {
  const url = new URL(update.url)
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("更新包下载地址必须使用 HTTP 或 HTTPS")
  }
  await openUrl(url.toString())
}

export const androidUpdater: AppUpdater<AppCheckResponse> = {
  async check() {
    const res = await api_app_check({ platform, arch, current_version: currentVersion })
    if (!res) return await noUpdate()
    if (!semver.valid(res.version)) throw new Error("更新接口返回的版本号无效")
    if (semver.compare(res.version, currentVersion) <= 0) return await noUpdate()
    return res
  },

  getCurrentVersion() {
    return currentVersion
  },

  getUpdateInfo(update) {
    return update
  },

  async isPackageReady(update) {
    return await hasCachedAndroidUpdate(update)
  },

  async download(update, callback) {
    await downloadPackage(update, callback)
  },

  async downloadAndInstall(update, callback) {
    await downloadPackage(update, callback)
    await installAndroidUpdate(update)
  },

  async install(update) {
    await installAndroidUpdate(update)
  },

  async relaunch() {
    // Android 由系统安装器接管，没有应用内重启能力
  },

  async close() {
    // 保留缓存，用户选择「稍后安装」时可直接复用
  },

  async openDownloadLink(update) {
    await openUpdateDownloadLink(update)
  },
}
