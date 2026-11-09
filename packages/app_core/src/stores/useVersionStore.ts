import { defineStore } from "pinia"
import { ref } from "vue"

import { VersionDiffItem } from "@app/core/apis/version/type"

export const version = () => {
  const versionDiffList = ref<Array<VersionDiffItem>>([])

  return { versionDiffList }
}

export const useVersionStore = defineStore("VersionStore", version, { persist: true })
