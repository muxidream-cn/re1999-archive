// 执行： pnpm add clsx tailwind-merge 安装
// import { clsx, type ClassValue } from "clsx"
// import { twMerge } from "tailwind-merge"

// /**
//  * 合并多个 CSS 类名，并自动处理 Tailwind CSS 类名冲突。
//  * @param inputs - 需要合并的 CSS 类名或条件类名
//  * @returns 合并并优化后的 CSS 类名字符串
//  */
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

export { cn } from "cn"
