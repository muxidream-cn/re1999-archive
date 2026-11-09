import { type Ref, type WritableComputedRef, computed } from "vue"

/**
 * 为 Ref<boolean> 创建可写 computed 绑定
 * @param ref Ref<boolean>
 */
export function createComputedForRef(ref: Ref<boolean>): WritableComputedRef<boolean> {
  return computed({
    get: () => ref.value,
    set: (value) => {
      // ref.value = value
    },
  })
}

/**
 * 为 Ref<{ [key]: boolean }> 的属性创建可写 computed 绑定
 * @param refObj ref 对象
 * @param key 属性名
 */
export function createComputedForRefObject<T extends Record<string, any>, K extends keyof T & string>(
  refObj: Ref<T>,
  key: K
): WritableComputedRef<T[K]> {
  return computed({
    get() {
      return refObj.value[key]
    },
    set(value) {
      // refObj.value[key] = value
    },
  })
}

/**
 * 为 reactive 对象的某个布尔属性创建可写 computed 绑定
 * @param obj - reactive 对象
 * @param key - 属性名（必须是 obj 的 key，且值为 boolean）
 */
export function createComputedForReactive<T extends Record<string, any>, K extends keyof T & string>(obj: T, key: K): WritableComputedRef<T[K]> {
  return computed({
    get() {
      return obj[key]
    },
    set(value) {
      // obj[key] = value
    },
  })
}
