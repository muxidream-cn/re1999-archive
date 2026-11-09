export interface FileSaveItem {
  url: string
  fileName: string
}

export interface FileSaveResult {
  fileName: string
  path: string | null
  cancelled: boolean
  error: string | null
}

export interface DownloadProgress {
  completed: number
  total: number
  fileName: string
  error: string | null
}

export interface FileSaver {
  save(items: FileSaveItem[], onProgress?: (progress: DownloadProgress) => void): Promise<FileSaveResult[]>
}
