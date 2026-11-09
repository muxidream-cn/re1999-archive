/** 蜘蛛相对首页容器的定位偏移 */
export interface SpiderPosition {
  right: string
  top: string
}

/** 端侧蜘蛛配置；移动端未提供定位时回退桌面值 */
export interface SpiderConfig {
  scale: { desktop: number; mobile: number }
  position: { desktop: SpiderPosition; mobile?: SpiderPosition }
}
