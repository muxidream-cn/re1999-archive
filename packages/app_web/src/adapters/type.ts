import type { AxiosRequestConfig } from "axios"

/** 自定义axios请求配置 */
type CustomAxiosConfig = {
  /** 取消重定向 */
  noRedirect?: boolean
  /** 超时时间 */
  timeout?: number
}

/** 自定义axios请求配置（取消重定向） */
export type MyAxiosRequestConfig = AxiosRequestConfig & CustomAxiosConfig
