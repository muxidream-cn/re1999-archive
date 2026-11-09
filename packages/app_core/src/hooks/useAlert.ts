// useAlert.ts
import { ref } from "vue"

// 1. 定义消息类型枚举
export type AlertType = "success" | "warning" | "error" | "info"

// 2. 定义图标映射枚举（这里使用常见的 Lucide/Feather 图标类名作为示例）
export const IconMap: Record<AlertType, string> = {
  success: "lucide-check-circle",
  warning: "lucide-alert-triangle",
  error: "lucide-x-circle",
  info: "lucide-info",
}

export interface AlertMessage {
  id: number
  title: string
  description?: string
  type?: AlertType
  icon?: string // 如果不传，会根据 type 自动使用 IconMap 中的图标
  duration?: number
  closable?: boolean
  action?: { label: string; onClick: () => void }
}

export const alertMessages = ref<AlertMessage[]>([])
let messageId = 0

/**
 *
 */
export function useAlert() {
  const show = (options: Omit<AlertMessage, "id">) => {
    const id = ++messageId

    // 智能合并：如果传了 icon 就用传的，没传就根据 type 自动匹配
    const finalIcon = options.icon || (options.type ? IconMap[options.type] : undefined)

    const newMsg: AlertMessage = {
      duration: 3000, // 默认 3秒
      closable: true, // 默认允许关闭
      ...options,
      id,
      icon: finalIcon,
    }

    alertMessages.value.push(newMsg)

    // 如果 duration > 0，则自动关闭
    if (newMsg.duration && newMsg.duration > 0) {
      setTimeout(() => {
        hide(id)
      }, newMsg.duration)
    }
  }

  const hide = (id: number) => {
    const index = alertMessages.value.findIndex((msg) => msg.id === id)
    if (index !== -1) alertMessages.value.splice(index, 1)
  }

  return { alertMessages, show, hide }
}

// // 连续调用，消息会自动向下堆叠
// // 1. 基础提示（无类型，无图标）
// const test_1 = () => show({ title: "系统消息", description: "这是一条普通提示" })

// // 2. 成功提示（自动带 ✅ 图标，绿色边框）
// const test_2 = () => show({ type: "success", title: "保存成功", description: "数据已同步至云端" })

// // 3. 错误提示（带操作按钮，持续 5 秒）
// const test_3 = () =>
//   show({
//     type: "error",
//     title: "网络异常",
//     description: "无法连接到服务器",
//     duration: 5000,
//     action: {
//       label: "点击重试",
//       onClick: () => console.log("正在重试..."),
//     },
//   })

// // 4. 强制不显示关闭按钮（必须等时间结束或点按钮才消失）
// const test_4 = () =>
//   show({
//     type: "warning",
//     title: "会话即将过期",
//     closable: false,
//     duration: 10000,
//     action: { label: "立即续期", onClick: () => console.log("正在续期...") },
//   })
