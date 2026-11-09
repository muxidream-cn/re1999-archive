import { invoke } from "@tauri-apps/api/core"
import { appLocalDataDir, join } from "@tauri-apps/api/path"
import { BaseDirectory, exists, mkdir, remove } from "@tauri-apps/plugin-fs"

import type { AppCheckResponse } from "@app/core/apis/app/type"

const updateDirectory = "files/apk-updates"
const apkFileName = "update.apk"
const temporaryFileName = "update.apk.part"
const hashPattern = /^[a-f\d]{32}$/i

let operationQueue = Promise.resolve()

const withUpdateLock = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previous = operationQueue
  let release!: () => void
  operationQueue = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous
  try {
    return await operation()
  } finally {
    release()
  }
}

const toExpectedHash = (hash: string): string => {
  if (!hashPattern.test(hash)) {
    throw new Error("更新接口返回的安装包 MD5 格式无效")
  }
  return hash.toLowerCase()
}

const getApkPath = async (): Promise<string> => join(await appLocalDataDir(), updateDirectory, apkFileName)

const getFileMd5 = (path: string): Promise<string> => invoke<string>("plugin:status-bar|get_apk_md5", { path })

const removeIfExists = async (path: string): Promise<void> => {
  if (await exists(path, { baseDir: BaseDirectory.AppLocalData })) {
    await remove(path, { baseDir: BaseDirectory.AppLocalData })
  }
}

const ensureApkReady = async (updateInfo: AppCheckResponse): Promise<string> => {
  const expectedHash = toExpectedHash(updateInfo.hash)
  await mkdir(updateDirectory, { baseDir: BaseDirectory.AppLocalData, recursive: true })

  const apkPath = await getApkPath()
  if (await exists(`${updateDirectory}/${apkFileName}`, { baseDir: BaseDirectory.AppLocalData })) {
    const cachedHash = await getFileMd5(apkPath)
    if (cachedHash.toLowerCase() === expectedHash) {
      return apkPath
    }
  }

  const downloadUrl = new URL(updateInfo.url)
  if (downloadUrl.protocol !== "https:" && downloadUrl.protocol !== "http:") {
    throw new Error("更新包下载地址必须使用 HTTP 或 HTTPS")
  }

  await invoke("download_android_apk", { url: downloadUrl.toString(), expectedSize: updateInfo.size })
  const downloadedHash = await getFileMd5(apkPath)
  if (downloadedHash.toLowerCase() !== expectedHash) {
    throw new Error("更新包 MD5 校验失败")
  }

  return apkPath
}

export const hasCachedAndroidUpdate = (updateInfo: AppCheckResponse): Promise<boolean> =>
  withUpdateLock(async () => {
    const expectedHash = toExpectedHash(updateInfo.hash)
    const relativeApkPath = `${updateDirectory}/${apkFileName}`
    if (!(await exists(relativeApkPath, { baseDir: BaseDirectory.AppLocalData }))) {
      return false
    }

    const actualHash = await getFileMd5(await getApkPath())
    return actualHash.toLowerCase() === expectedHash
  })

export const prepareAndroidUpdate = (updateInfo: AppCheckResponse): Promise<string> => withUpdateLock(() => ensureApkReady(updateInfo))

export const installAndroidUpdate = (updateInfo: AppCheckResponse): Promise<void> =>
  withUpdateLock(async () => {
    const apkPath = await ensureApkReady(updateInfo)
    const expectedHash = toExpectedHash(updateInfo.hash)
    const actualHash = await getFileMd5(apkPath)
    if (actualHash.toLowerCase() !== expectedHash) {
      throw new Error("安装前 MD5 校验失败，已阻止安装")
    }

    await invoke("plugin:status-bar|open_apk", { path: apkPath })
  })

export const clearAndroidUpdateCache = (): Promise<boolean> =>
  withUpdateLock(async () => {
    const installInProgress = await invoke<boolean>("plugin:status-bar|is_apk_install_in_progress")
    if (installInProgress) {
      return false
    }

    await removeIfExists(`${updateDirectory}/${apkFileName}`)
    await removeIfExists(`${updateDirectory}/${temporaryFileName}`)
    return true
  })
