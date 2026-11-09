<script setup lang="ts">
import { Minus } from "@lucide/vue"

import useRoleSelect from "@app/core/hooks/select/useRole"
import { RoleGroupType } from "@app/core/types/role"
const props = defineProps({
  type: {
    type: String as PropType<RoleGroupType>,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: "一个或多个",
  },
})

const { init, isGroupIndeterminate, isGroupSelected, getGroups, toggleGroup } = useRoleSelect()

const select = computed<string[]>({
  get() {
    return getGroups(props.type).filter((group) => isGroupSelected(props.type, group))
  },
  set(value: string[]) {
    const old = select.value
    const added = value.find((item) => !old.includes(item))
    const removed = old.find((item) => !value.includes(item))

    if (added) {
      toggleGroup(props.type, added)
    }
    if (removed) {
      toggleGroup(props.type, removed)
    }
  },
})
onMounted(() => {
  init()
})
</script>

<template>
  <div>
    <Label class="mb-2 text-sm">{{ name }}({{ getGroups(props.type).length }})</Label>
    <Select v-model="select" multiple>
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="props.placeholder" />
      </SelectTrigger>
      <SelectContent position="popper">
        <template v-for="item in getGroups(props.type)" :key="item">
          <SelectItem :value="item">
            <Minus v-if="isGroupIndeterminate(props.type, item)" class="text-muted-foreground" />
            {{ item }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </div>
</template>
