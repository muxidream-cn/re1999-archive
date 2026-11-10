import momo from "@app/core/apis"
import { App } from "@app/core/apis/path"

import type { AppCheckParams, AppCheckResponse, AppLatestVersion } from "./type"
import type { ApiResponse } from "@app/core/apis/types"

/**
 * 读取错误响应体中的提示信息
 * @param response 失败响应
 */
const readErrorMessage = async (response: Response): Promise<string | null> => {
  const body = (await response.json().catch(() => null)) as { msg?: unknown } | null
  return typeof body?.msg === "string" && body.msg ? body.msg : null
}

/**
 * 获取程序检查更新数据；无可用更新时服务端返回 HTTP 204
 * @param params 检查更新参数
 * @param params.platform 目标平台
 * @param params.arch 目标架构
 * @param params.current_version 客户端当前版本
 */
const api_app_check = async ({ platform, arch, current_version }: AppCheckParams): Promise<AppCheckResponse | null> => {
  const target = encodeURIComponent(`${platform}-${arch}`)
  const version = encodeURIComponent(current_version)
  const response = await momo.raw(`${App.check}/${target}/${version}`)

  if (response.status === 204) return null
  // 服务端以 HTTP 400 表示该平台/架构暂未发布任何版本，优先透出其提示文案
  if (!response.ok) throw new Error((await readErrorMessage(response)) ?? `检查更新失败：HTTP ${response.status}`)

  return (await response.json()) as AppCheckResponse
}

/**
 * 获取各平台及架构的最新发布版本。
 * 服务端返回统一响应结构，版本列表位于 data 字段。
 */
const api_app_version_latest = async (): Promise<ApiResponse<AppLatestVersion[]>> => momo.get<AppLatestVersion[]>(App.latest)

export { api_app_check, api_app_version_latest }
