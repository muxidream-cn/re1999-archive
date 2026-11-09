import { createUrl } from "@app/core/apis/client"

import type { ApiResponse, HttpClient, RequestConfig } from "@app/core/apis/types"

const request = async <T>(method: string, baseUrl: string, path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const isQuery = method === "GET" || method === "DELETE"
  const response = await window.fetch(createUrl(baseUrl, path, isQuery ? config?.params : undefined), {
    method,
    headers: body instanceof FormData ? config?.headers : { "Content-Type": "application/json", ...config?.headers },
    body: isQuery || body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(config?.timeout ?? 3000),
  })
  return (await response.json().catch(() => ({ code: response.status, msg: response.statusText }))) as ApiResponse<T>
}

const normalizeConfig = (config?: RequestConfig | Record<string, unknown>): RequestConfig | undefined => {
  if (!config) return undefined
  return "params" in config || "headers" in config || "timeout" in config ? config : { params: config as Record<string, unknown> }
}

/**
 * 原始请求：返回未包装的 Response，供需要自行处理响应体/流/状态码/非 JSON 的场景
 * @param input 请求地址
 * @param init 请求配置
 */
export const rawRequest = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => window.fetch(input, init)

export const createWebHttpClient = (baseUrl: string): HttpClient => ({
  get: <T>(path: string, config?: RequestConfig | Record<string, unknown>) => request<T>("GET", baseUrl, path, undefined, normalizeConfig(config)),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>("POST", baseUrl, path, body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>("PUT", baseUrl, path, body, config),
  delete: <T>(path: string, config?: RequestConfig) => request<T>("DELETE", baseUrl, path, undefined, config),
  raw: (path, init) => rawRequest(createUrl(baseUrl, path), init),
})
