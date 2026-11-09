import { defineStore } from "pinia"

/**
 * 设置值仓库
 *
 * 按 `settings/schema.ts` 里每个设置项的 `storage` 决定读写哪个桶：
 * - `values`：长期设置，持久化到 localStorage
 * - `sessionValues`：临时设置，持久化到 sessionStorage（会话结束即失效）
 *
 * 只负责存 `key -> value`，默认值与读写行为见 `hooks/useSettings.ts`。
 */
export const settings = () => {
  /** 长期设置（未写入过的项不在其中，使用 Schema 的 default） */
  const values = ref<Record<string, any>>({})

  /** 临时设置（会话级，关闭标签页 / 应用后失效） */
  const sessionValues = ref<Record<string, any>>({})

  return { values, sessionValues }
}

export const useSettingsStore = defineStore("SettingsStore", settings, {
  persist: [
    {
      key: "SettingsStore",
      pick: ["values"],
      storage: localStorage,
    },
    {
      // 两个持久化条目必须使用不同 key，否则会互相覆盖
      key: "SettingsStore:session",
      pick: ["sessionValues"],
      storage: sessionStorage,
    },
  ],
})
