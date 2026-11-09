/** 更新信息 */
export type AppCheckResponse = {
  force_update: boolean
  hash: string
  notes: string
  pub_date: string
  signature: string
  size: number
  url: string
  version: string
}

/** 各平台及架构的最新发布版本信息 */
export type AppLatestVersion = {
  platform: string
  architecture: string
  version: string
  publish_time: string
  file_name: string
  download_url: string
  file_size: string
  file_hash: string
}

/** 检查更新的目标平台、架构和客户端版本 */
export type AppCheckParams = {
  platform: string
  arch: string
  current_version: string
}
