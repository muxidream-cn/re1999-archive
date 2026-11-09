import { toast } from "vue-sonner"
import z from "zod"

/** 存储每个请求的错误状态 */
const errorPrintMap = new Map<string, boolean>()

/**try-catch错误输出函数*/
export const errorMsg = (err: any, message?: string) => {
  console.error("errorMsg", err, message)
  let msg = ""

  if (err instanceof z.ZodError) {
    // 提取所有错误信息并格式化
    const errorMessages = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    console.error("Zod 验证失败:", errorMessages)
  } else if (typeof err === "string") {
    msg = err
  } else if (err instanceof Error) {
    msg = err.message
  } else msg = message ?? "未知错误"

  // 检查这个请求是否已经显示过错误
  // if (!errorPrintMap.has(msg)) {
  errorPrintMap.set(msg, true)
  console.error(msg)
  toast.error(msg)
  // 一段时间后清除标志位
  setTimeout(() => {
    errorPrintMap.delete(msg)
  }, 2000)
  // }
}

/** 根据浏览器标识判断是不是移动端设备 */
// export const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
