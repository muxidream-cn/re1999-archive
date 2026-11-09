import type { HttpClient, RequestConfig } from "@app/core/apis/types"

let httpClient: HttpClient | null = null

export const configureApiClient = (client: HttpClient) => {
  httpClient = client
}

const getClient = () => {
  if (!httpClient) {
    throw new Error("API client has not been configured")
  }
  return httpClient
}

/**拼接请求地址和路径、请求参数
 * @param baseUrl 基础地址
 * @param path 请求路径
 * - 若 path 是完整地址而非路径，可访问path中的外部链接
 * @param params 请求参数
 * @returns 完整的请求地址
 */
export const createUrl = (baseUrl: string, path: string, params?: Record<string, unknown>) => {
  const normalizedBaseUrl = `${baseUrl.replace(/\/+$/, "")}/`
  const normalizedPath = path.replace(/^\/+/, "")

  const url = new URL(normalizedPath, normalizedBaseUrl)

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export const apiClient: HttpClient = {
  get: <T>(path: string, config?: RequestConfig | Record<string, unknown>) => getClient().get<T>(path, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) => getClient().post<T>(path, body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) => getClient().put<T>(path, body, config),
  delete: <T>(path: string, config?: RequestConfig) => getClient().delete<T>(path, config),
  raw: (path, init) => getClient().raw(path, init),
}
