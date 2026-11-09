import type { SpiderConfig } from "./type"

/** 未注入时的默认配置，与 web 端一致 */
const defaultSpiderConfig: SpiderConfig = {
  scale: { desktop: 0.5, mobile: 0.4 },
  position: {
    desktop: { right: "0rem", top: "-125px" },
    mobile: { right: "-1rem", top: "-140px" },
  },
}

let spiderConfig: SpiderConfig = defaultSpiderConfig

/**
 * 在端侧 bootstrap 中注入该端的蜘蛛配置
 * @param config 该端的蜘蛛配置
 */
export const configureSpider = (config: SpiderConfig) => {
  spiderConfig = config
}

/** 读取当前端的蜘蛛配置 */
export const useSpiderConfig = (): SpiderConfig => spiderConfig
