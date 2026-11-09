import { isReactive, isReadonly, isRef, toRaw } from "vue"
import { toast } from "vue-sonner"

import { errorMsg } from "@app/core/utils/system"

/**获取当前页面亮度*/
export const getCurrentBrightness = (): number => {
  const BRIGHTNESS_REGEX = /brightness\((\d+)%\)/
  const filter = document.body.style.filter
  const match = filter.match(BRIGHTNESS_REGEX)
  if (match) {
    return parseInt(match[1], 10)
  }
  // 如果没有设置 brightness，默认为 100%
  return 100
}

/**修改页面亮度*/
export const changeLight = (value: number | string = 100) => {
  let num = Number(value)
  if (isNaN(num)) num = 100
  if (num > 130) num = 130
  else if (num < 30) num = 30
  if (num === getCurrentBrightness()) return
  console.log("修改页面亮度", value, num)
  document.body.style.filter = ` brightness(${num}%)`
}

/**
 * 递归去除对象的响应式，转换为普通对象
 * @param obj 目标对象
 */
export const removeReactivity = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  // 如果是 Vue 响应式对象，先用 toRaw 去除响应式
  if (isRef(obj) || isReactive(obj) || isReadonly(obj)) {
    const rawValue = toRaw(obj)
    return removeReactivity(rawValue) as T
  }

  // 如果是普通对象或数组，递归处理
  if (Array.isArray(obj)) {
    return obj.map((item) => removeReactivity(item)) as unknown as T
  }

  // 如果是普通对象
  const result = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      ;(result as any)[key] = removeReactivity((obj as any)[key])
    }
  }

  return result
}

/**
 * 格式化仪表显示的字符串数字
 * @param numStr 字符串数字，允许正负数，整数和小数
 * - 只有个位：保留两位小数
 * - 有十位无百位：保留一位小数
 * - 如果有百位，不保留小数
 */
export const formatInstrumentNumber = (numStr: string | number): string => {
  const num = typeof numStr === "number" ? numStr : parseFloat(numStr)

  // 处理无效输入
  if (isNaN(num)) {
    return numStr.toString()
  }

  // 获取绝对值用于判断位数
  const absNum = Math.abs(num)

  let decimalPlaces: number

  if (absNum >= 100) {
    // 百位及以上：不保留小数
    decimalPlaces = 0
  } else if (absNum >= 10) {
    // 十位：保留一位小数
    decimalPlaces = 1
  } else {
    // 个位及以下：保留两位小数
    decimalPlaces = 2
  }

  // 使用 toFixed 并移除末尾的零（但保留至少一个小数位）
  const formatted = num.toFixed(decimalPlaces)

  // 如果不需要小数，直接返回整数部分
  if (decimalPlaces === 0) {
    return parseFloat(formatted).toString()
  }

  // 移除末尾不必要的零，但确保有小数点
  return formatted.replace(/\.?0+ $ /, "")
}

/**
 * 格式化仪表或开关的编号
 * @param symbol 仪表或开关的编号
 */
export const formatSymbol = (symbol?: string) => {
  const label = symbol?.trim()

  if (!label) return "??"

  // 提取字母和数字
  const letters = label.match(/[A-Za-z]+/)?.[0] ?? "" // 只匹配字母
  // const letters = label.replace(/\d+/g, "") ?? "" // 匹配非数字
  const numbers = label.match(/\d+/)?.[0] ?? ""

  // 都不存在,直接返回
  if (!letters && !numbers) return label

  // 同时存在,换行
  if (letters && numbers) {
    return `${letters}\n${numbers}`
  }

  // 只存在一个,返回
  return letters || numbers
}

/**
 * 计算天数差值
 * @param targetDateStr 目标日期字符串
 */
export const daysUntil = (targetDateStr: string) => {
  // 将目标日期字符串转换为 Date 对象
  const targetDate = new Date(targetDateStr)

  // 获取当前日期和时间
  const currentDate = new Date()

  // 计算两个日期之间的时间差（单位：毫秒）
  const timeDifference = targetDate.getTime() - currentDate.getTime()

  // 将时间差转换为天数，并使用 Math.floor 进行舍去处理
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

  return daysDifference
}

/**
 *  将远程和本地设置合并转为对象
 * @param keyIdArr 要合并的数据的keyId数组
 * @param localConfigs 本地配置对象
 * @param remoteConfigs 远程配置对象
 */
export const mergeConfigsObjectToArray = <TKey extends number, TValue extends Record<string, any>, TPartial extends Partial<TValue>>(
  keyIdArr: TKey[],
  localConfigs: Partial<Record<TKey, TValue>>,
  remoteConfigs: Partial<Record<TKey, TPartial>>
): (TValue & TPartial)[] => {
  return keyIdArr
    .map((keyId) => {
      const base = localConfigs[keyId]
      if (!base) return
      return {
        ...base,
        ...remoteConfigs[keyId],
      }
    })
    .filter((item) => item !== undefined)
}

/**
 * 根据固定 keyId 列表对数组进行排序
 * @param list - 需要排序的数组
 * @param fixedOrder - 固定部分的 keyId 列表
 */
export const sortCompileDataWithFixedKeyIds = <T extends { keyId: number }>(list: T[], fixedOrder: number[]): T[] => {
  const fixedSet = new Set(fixedOrder)

  // 固定部分：按 fixedOrder 顺序取
  const fixed = fixedOrder.map((id) => list.find((item) => item.keyId === id)).filter(Boolean) as T[]

  // 其余部分：排除固定 id，再排序
  const rest = list.filter((item) => !fixedSet.has(item.keyId)).sort((a, b) => a.keyId - b.keyId)

  return [...fixed, ...rest]
}

type KeyOfType<T, K extends keyof T> = T[K] extends string | number | symbol ? Exclude<T[K], undefined | null> : never

/**
 * 将对象数组转换为以指定字段为键的 Record 对象
 * @param array - 输入的对象数组
 * @param keyField - 用作键的字段名（必须存在于每个对象中）
 * @param options - 可选配置
 * @param options.skipInvalidKeys 是否跳过 key 为 undefined / null 的项（默认 true）
 * @param options.allowDuplicateKeys 是否在 key 重复时覆盖（默认 true），设为 false 可抛错
 * @param options.prefix 自定义错误前缀（默认为函数名）
 * @returns Record<keyType, T>
 */
export function arrayToRecord<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  keyField: K,
  options: {
    skipInvalidKeys?: boolean
    allowDuplicateKeys?: boolean
    prefix?: string
  } = {
    skipInvalidKeys: true,
    allowDuplicateKeys: true,
    prefix: "[arrayToRecord]",
  }
): Record<KeyOfType<T, K>, T> {
  const { skipInvalidKeys = true, allowDuplicateKeys = true, prefix = "[arrayToRecord]" } = options

  // 使用类型断言创建初始空对象
  const result = {} as Record<KeyOfType<T, K>, T>

  for (const item of array) {
    const key = item[keyField]

    if (skipInvalidKeys && (key == null || (typeof key !== "string" && typeof key !== "number" && typeof key !== "symbol"))) {
      continue
    }

    // 运行时确保 key 是合法类型
    if (typeof key !== "string" && typeof key !== "number" && typeof key !== "symbol") {
      throw new Error(`${prefix} 键必须是 string/number/symbol，得到: ${typeof key}`)
    }

    if (!allowDuplicateKeys && key in result) {
      throw new Error(`${prefix} 重复键: ${String(key)}`)
    }

    // 关键：这里需要类型断言，因为 TS 无法推导 key 是 KeyOfType<T, K>
    ;(result as any)[key] = item
  }

  return result
}

/**
 * 比较两个对象数组中指定字段是否有变化（带字段存在性校验）
 * @param oldList 旧数组
 * @param newList 新数组
 * @param keyField 用于匹配对象的字段名（如 'id'）
 * @param compareFields 需要对比的字段名数组（如 ['status']）
 * @param options 可选配置
 * @param options.strict 是否在字段缺失时抛出错误（默认：true）
 * @param options.prefix 自定义错误前缀（默认为函数名）
 * @returns 如果长度不同或任意 compareFields 值变化，返回 true；否则 false
 */
export const hasArrayChanged = <T extends Record<string, any>>(
  oldList: T[],
  newList: T[],
  keyField: keyof T,
  compareFields: (keyof T)[],
  options: {
    /** 是否在字段缺失时抛出错误（默认：true） */
    strict?: boolean
    /** 自定义错误前缀 */
    prefix?: string
  } = { strict: false, prefix: "[hasArrayChanged]" }
): boolean => {
  const { strict = false, prefix = "[hasArrayChanged]" } = options

  // 1. 长度不同 → 肯定有变化
  if (oldList.length !== newList.length) {
    return true
  }

  // 辅助函数：检查字段是否存在
  const checkFieldExists = (obj: T, field: keyof T, source: string) => {
    if (!(field in obj)) {
      const msg = `${prefix} 字段 "${String(field)}" 在 ${source} 中不存在。对象示例: ${JSON.stringify(obj)}`
      if (strict) {
        throw new Error(msg)
      } else {
        console.warn(msg)
        return true
      }
    }
  }

  // 2. 构建旧数组的 Map，并校验 keyField 和 compareFields
  const oldMap = new Map<T[keyof T], T>()
  for (const item of oldList) {
    // 校验 keyField
    checkFieldExists(item, keyField, "oldList 的某项")
    // 校验 compareFields
    for (const field of compareFields) {
      checkFieldExists(item, field, "oldList 的某项")
    }
    oldMap.set(item[keyField], item)
  }

  // 3. 遍历新数组，校验并对比
  for (const newItem of newList) {
    // 校验 keyField
    checkFieldExists(newItem, keyField, "newList 的某项")
    // 校验 compareFields
    for (const field of compareFields) {
      checkFieldExists(newItem, field, "newList 的某项")
    }

    const key = newItem[keyField]
    const oldItem = oldMap.get(key)

    if (oldItem === undefined) {
      return true
    }

    for (const field of compareFields) {
      if (oldItem[field] !== newItem[field]) {
        return true
      }
    }
  }

  return false
}

/**
 * 比较一个对象数组和一个 Map/对象，判断指定字段是否有变化
 * @param array - 对象数组，每个对象必须包含 idField
 * @param mapOrRecord - Map 或 Record（普通对象）
 * @param idField - 数组对象中用于匹配的字段名（如 'id'）
 * @param compareFields - 需要对比的字段名数组（如 ['status']）
 * @param options - 可选配置
 * @param options.strict 是否在字段缺失时抛出错误（默认：true）
 * @param options.prefix 自定义错误前缀（默认为函数名）
 */
export const hasArrayMapChanged = <T extends Record<string, any>, K extends keyof T, M extends Map<T[K], T> | Record<string | number, T>>(
  array: T[],
  mapOrRecord: M,
  idField: K,
  compareFields: (keyof T)[],
  options: {
    strict?: boolean
    prefix?: string
  } = { strict: true, prefix: "[hasArrayMapChanged]" }
): boolean => {
  const { strict = true, prefix = "[hasArrayMapChanged]" } = options

  // 1. 判断是 Map 还是普通对象
  const isMap = mapOrRecord instanceof Map
  const mapSize = isMap ? (mapOrRecord as Map<any, any>).size : Object.keys(mapOrRecord).length

  // 2. 长度不同 → 有变化
  if (array.length !== mapSize) {
    return true
  }

  // 辅助：获取 map 中的值
  const getFromMap = (key: any): T | undefined => {
    if (isMap) {
      return (mapOrRecord as Map<any, T>).get(key)
    } else {
      return (mapOrRecord as Record<any, T>)[key]
    }
  }

  // 辅助：检查字段是否存在
  const checkFieldExists = (obj: T, field: keyof T, source: string) => {
    if (!(field in obj)) {
      const msg = `${prefix} 字段 "${String(field)}" 在 ${source} 中不存在。对象: ${JSON.stringify(obj)}`
      if (strict) {
        throw new Error(msg)
      } else {
        console.warn(msg)
      }
    }
  }

  // 3. 遍历数组，逐个对比
  for (const item of array) {
    // 校验 idField 和 compareFields
    checkFieldExists(item, idField, "array 的某项")
    for (const field of compareFields) {
      checkFieldExists(item, field, "array 的某项")
    }

    const key = item[idField]
    const mapItem = getFromMap(key)

    // 如果 map 中找不到对应项 → 有变化
    if (mapItem === undefined) {
      return true
    }

    // 校验 mapItem 的 compareFields（可选，根据需求决定是否需要）
    for (const field of compareFields) {
      if (!(field in mapItem)) {
        const msg = `${prefix} 字段 "${String(field)}" 在 map/key=${key} 中不存在。`
        if (strict) {
          throw new Error(msg)
        } else {
          console.warn(msg)
        }
        return true // 字段缺失视为变化
      }
    }

    // 对比指定字段
    for (const field of compareFields) {
      if (item[field] !== mapItem[field]) {
        return true
      }
    }
  }

  return false
}

/**
 * 约束响应，最短等待时间内返回不弹出开始提醒，否则弹出开始和结束提醒
 * @param requestFn - 请求函数
 * @param minDuration - 请求函数最短等待时间
 * @param start_msg - 开始提醒
 * @param success_msg - 成功提醒
 * @param waring_msg - 警告提醒
 * @param error_msg - 错误提醒
 */
export const simulateRequest = async <T>(
  requestFn: () => Promise<ResultData<T>>,
  minDuration = 500,
  start_msg?: string,
  success_msg?: string,
  waring_msg?: string,
  error_msg?: string
) => {
  const startTime = Date.now()

  let shouldLogStart = false
  let msgType: "success" | "warning" = "warning"
  let msg = ""

  // 创建一个定时器，如果 请求函数最短等待时间 内没有返回，就标记需要打印开始
  const timer = setTimeout(() => {
    shouldLogStart = true
    toast.warning(start_msg || "请求开始")
  }, minDuration)

  try {
    const result = await requestFn()
    // const
    if (result.code === 200) {
      return result
    }

    return result
  } catch (error) {
    errorMsg(error, error_msg || "请求失败")
  } finally {
    clearTimeout(timer)
    const duration = Date.now() - startTime

    if (duration > minDuration && !shouldLogStart) {
      console.log("请求开始") // 防止极端情况刚好500ms触发不了
      toast.warning("请求开始")
    }

    console.log("请求结束，耗时:", duration, "ms")
    toast.warning(`请求结束，耗时:${duration}ms`)
  }
}

/**
 * 报警样式
 * @param status - 报警状态
 * - 0: 正常
 * - 1或2: 警告
 * - 大于等于3: 危险
 * returns 颜色类名
 */
export const getInstrumentWarningColor = (status = 0) => {
  switch (status) {
    case 0:
      return ""
    case 1:
      return "yellow"
    case 2:
      return "yellow"
    case 3:
    case 4:
    case 5:
    default:
      return "red"
  }
}

/**
 * 报警样式
 * @param status - 报警状态
 * - 0: 正常
 * - 1或2: 警告
 * - 大于等于3: 危险
 * returns 颜色类名
 */
export const getInstrumentTextWarningColor = (status = 0) => {
  switch (status) {
    case 0:
      return ""
    case 1:
      return "#1f5716"
    case 2:
      return "#1f5716"
    case 3:
    case 4:
    case 5:
    default:
      return "white"
  }
}

/**
 * 获取机组供气状态及其对应的样式
 * @param type - 机组状态
 */
export const getTextAndClass = (type: number) => {
  switch (type) {
    case 0:
      return "stop"
    case 1:
    case 2:
      return ""
    default:
      return "danger blink"
  }
}

// /** 等待 Java 启动 */
// export const isReady = async () => {
//   let startTime = Date.now()

//   const check = async (): Promise<boolean> => {
//     // 超时判断（5秒 = 5000毫秒）
//     if (Date.now() - startTime > 15000) {
//       console.error("等待 Java 启动超时！")
//       toast.error("等待本地后端启动超时，请刷新或重新启动程序！")
//       return false
//     }

//     const res = await onJavaStarted()
//     const { code, data } = res
//     console.warn("确认 Java 是否启动：", res)

//     if (code === 200 && data) {
//       return true
//     } else if (code === 300) {
//       console.log("不启动本地后端。")
//       toast.warning("不启动本地后端。")
//       return false
//     } else if (code === 400) {
//       console.log("程序错误，检查本地后端状态失败！")
//       toast.error("程序错误，检查本地后端状态失败！")
//       return false
//     } else {
//       // 等待半秒再次执行
//       await new Promise((resolve) => setTimeout(resolve, 500))
//       return check()
//     }
//   }

//   return check()
// }

/**
 * 延迟函数
 * @param time 延迟时间(ms)
 */
export const delay = async (time = 1000) => new Promise((r) => setTimeout(r, time))
