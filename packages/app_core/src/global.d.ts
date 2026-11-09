// 注意，此文件中根页面不可以有任何导入，否则全局类型会失效
// @see：https://juejin.cn/post/7224051399256096829

/** 后端返回的数据类型 */
declare interface ResultData<T> {
  code: number
  msg: string
  data?: T | null
}

/** ToggleButtonGroup 组件的数据类型 */
declare interface ToggleButtonGroupType {
  label: string
  disabled?: boolean
  fun: Function
}

/** Select 组件的数据类型 */
declare interface SelectOptionType<T = string | number> {
  value: T
  label: string
}

/** Select 组件的数据类型 */
declare interface SelectGroupOptionType {
  label: string
  group: Array<SelectOptionType>
}

/** 瀑布流插件没有TS类型文件 */
declare module "@lhlyu/vue-virtual-waterfall" {
  export const VirtualWaterfall: any

  const VueVirtualWaterfall: {
    install: (app: any) => void
  }

  export default VueVirtualWaterfall
}
