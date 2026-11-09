import type { AppUpdater, UpdateDownloadEvent } from "./type"

let updater: AppUpdater | null = null

export const configureUpdater = <T>(value: AppUpdater<T>) => {
  updater = value as AppUpdater
}

export const getUpdater = () => {
  return updater
}

export const hasUpdater = () => {
  return updater !== null
}

export type { AppUpdater, UpdateDownloadEvent }
