import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

import type { DownloadProgress, FileSaveItem, FileSaveResult, FileSaver } from "@app/core/adapters/fileSaver/type"

export const createAndroidFileSaver = (): FileSaver => ({
  save: async (items: FileSaveItem[], onProgress?: (progress: DownloadProgress) => void) => {
    const unlisten = onProgress ? await listen<DownloadProgress>("wallpaper-download-progress", (event) => onProgress(event.payload)) : null
    try {
      return await invoke<FileSaveResult[]>("save_remote_files", { items })
    } finally {
      unlisten?.()
    }
  },
})
