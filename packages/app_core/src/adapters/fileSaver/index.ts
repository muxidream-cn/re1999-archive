import { DownloadProgress, FileSaveItem, FileSaver } from "./type"

let fileSaver: FileSaver | null = null

export const configureFileSaver = (saver: FileSaver) => {
  fileSaver = saver
}

export const hasFileSaver = () => fileSaver !== null

export const saveFiles = (items: FileSaveItem[], onProgress?: (progress: DownloadProgress) => void) => {
  if (!fileSaver) {
    throw new Error("File saver has not been configured")
  }

  return fileSaver.save(items, onProgress)
}
