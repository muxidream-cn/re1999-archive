/**
 * 重新加载当前页面
 * - 无外部依赖，不受平台适配器初始化时序影响
 */
export const refreshPage = () => {
  location.reload()
}
