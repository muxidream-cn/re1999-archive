/**
 * 将字节数(Byte)转换为更大单位
 * @param byte 字节数
 * @param type 转换类型（单位）
 * @param withUint 返回值是否携带单位
 */
export const formatByte = (byte: number, type?: "KB" | "MB" | "GB", withUint = true) => {
  let num = "0"
  switch (type) {
    case "GB":
      num = (byte / 1000000000).toFixed(0)
      break
    case "MB":
      num = (byte / 1000000).toFixed(0)
      break
    default:
      // KB
      num = (byte / 1000).toFixed(0)
  }
  const unit = withUint ? (type ? type : "KB") : ""
  return num + unit
}
