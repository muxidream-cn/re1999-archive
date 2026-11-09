import type { SpiderConfig } from "@app/core/adapters/spider/type"

/** web 端蜘蛛配置：移动端缩小并上移，桌面端保持原始位置 */
export const spiderConfig: SpiderConfig = {
  scale: { desktop: 0.5, mobile: 0.4 },
  position: {
    desktop: { right: "0rem", top: "-125px" },
    mobile: { right: "-1rem", top: "-140px" },
  },
}
