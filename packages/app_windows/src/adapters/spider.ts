import type { SpiderConfig } from "@app/core/adapters/spider/type"

/** windows 端蜘蛛配置：不区分设备，沿用原有固定缩放与位置 */
export const spiderConfig: SpiderConfig = {
  scale: { desktop: 0.5, mobile: 0.5 },
  position: {
    desktop: { right: "-2.5rem", top: "-125px" },
  },
}
