import { relaunch } from "@tauri-apps/plugin-process"
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater"

import type { AppUpdater, UpdateDownloadEvent } from "@app/core/adapters/updater"
import type { AppCheckResponse } from "@app/core/apis/app/type"

const platformKey = "windows-x86_64"

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
      target: platformKey,
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
