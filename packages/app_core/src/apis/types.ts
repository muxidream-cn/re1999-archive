export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  noLoading?: boolean
  params?: Record<string, unknown>
}

export interface ApiResponse<T> {
  code: number
  msg: string
  data?: T
}

export interface HttpClient {
  get<T>(path: string, config?: RequestConfig | Record<string, unknown>): Promise<ApiResponse<T>>
  post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>>
  /** 原始请求：拼接 baseUrl，返回未包装的 Response */
  raw: (path: string, init?: RequestInit) => Promise<Response>
}
