export interface UpdateEvent {
  event: "Started" | "Progress" | "Finished"
  data?: {
    contentLength?: number
    chunkLength?: number
  }
}

export interface AppUpdate {
  version: string
  currentVersion: string
  body?: string
  downloadAndInstall: (callback: (event: UpdateEvent) => void) => Promise<void>
  download: (callback: (event: UpdateEvent) => void) => Promise<void>
  install: () => Promise<void>
  close: () => void
}

export interface AppServices {
  // updateTitle: () => Promise<void>
  // minimizeApp: () => Promise<void>
  // exitApp: () => Promise<void>
  // restartApp: () => Promise<void>
  // showKeyboard: () => Promise<void>
  // openSettingsDir: () => Promise<void>
  checkUpdate: () => Promise<AppUpdate | null>
  reload: () => void
  relaunch: () => void
  // localStore: {
  //   get: <T>(key: string) => Promise<ResultData<T>>
  //   set: <T>(key: string, value: T) => Promise<ResultData<undefined>>
  //   delete: (key: string) => Promise<ResultData<undefined>>
  //   clear: () => Promise<ResultData<undefined>>
  // }
  // autostart: {
  //   enable: () => Promise<boolean>
  //   disable: () => Promise<boolean>
  //   isEnabled: () => Promise<boolean>
  // }
}
