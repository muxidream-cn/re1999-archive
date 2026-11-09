export interface Utils {
  /**
   * 打开浏览器
   * @param url 要打开的网址
   */
  openUrl: (url: string) => Promise<void>
  /**
   * 设置安卓设备状态栏文本颜色
   * @param isLight 是否为亮色模式
   * - true 为亮色模式（黑色图标）
   * - false 为暗色模式（白色图标）
   */
  setStatusBar?: (isLight: boolean) => Promise<boolean>
}
