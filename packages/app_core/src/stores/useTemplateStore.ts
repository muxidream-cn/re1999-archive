import { defineStore } from "pinia"

export const template = () => {
  const testA = ref(1)
  const testB = ref(2)

  return { testA, testB }
}

export const useTemplateStore = defineStore("TemplateStore", template, {
  persist: [
    {
      pick: ["testA"],
      storage: localStorage,
    },
    {
      pick: ["testB"],
      storage: sessionStorage,
    },
  ],
})
