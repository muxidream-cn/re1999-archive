import { normalizeAppArch } from "@app/core/apis/app/arch"
import { arch, platform } from "@tauri-apps/plugin-os"
import { relaunch } from "@tauri-apps/plugin-process"
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater"

import type { AppUpdater, UpdateDownloadEvent } from "@app/core/adapters/updater"
import type { AppCheckResponse } from "@app/core/apis/app/type"

/** 运行期解析出的 updater 目标，首次解析后复用 */
let cachedTarget: string | null = null

/**
 * 获取 updater 目标，形如 `windows-x86_64`，与 tauri.conf.json 中 `{{target}}` 的展开形态一致
 * @returns 目标字符串
 */
const getTarget = (): string => {
  if (cachedTarget) return cachedTarget

  const currentArch = normalizeAppArch(arch())
  // 列表外的架构直接拦截，避免落到后端无法识别的 target
  if (!currentArch) throw new Error("暂未支持该架构，请联系开发者提供打包")

  // 注意：plugin-os 的 macOS 返回 `macos`，而 Tauri target 使用 `darwin`，将来支持 macOS 时需在此转换
  cachedTarget = `${platform()}-${currentArch}`
  return cachedTarget
}

const convertEvent = (event: DownloadEvent): UpdateDownloadEvent => {
  switch (event.event) {
    case "Started":
      return {
        type: "started",
        contentLength: event.data?.contentLength ?? 0,
      }

    case "Progress":
      return {
        type: "progress",
        chunkLength: event.data?.chunkLength ?? 0,
      }

    case "Finished":
      return {
        type: "finished",
      }
  }
}

export const windowsUpdater: AppUpdater<Update> = {
  async check() {
    return await check({
      target: getTarget(),
    })
  },

  getCurrentVersion(update) {
    return update.currentVersion
  },

  getUpdateInfo(update) {
    return update.rawJson as AppCheckResponse
  },

  async download(update, callback) {
    await update.download((event) => {
      callback?.(convertEvent(event))
    })
  },

  async downloadAndInstall(update, callback) {
    await update.downloadAndInstall((event) => {
      callback?.(convertEvent(event))
    })
  },

  async install(update) {
    await update.install()
  },

  async relaunch() {
    await relaunch()
  },

  close(update) {
    update.close()
  },
}
