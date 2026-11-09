import { defineStore } from "pinia"

import { RoleDiffItem } from "@app/core/apis/role/type"

export const role = () => {
  const roleDiffList = ref<Array<RoleDiffItem>>([])

  return { roleDiffList }
}

export const useRoleStore = defineStore("RoleStore", role, { persist: true })
