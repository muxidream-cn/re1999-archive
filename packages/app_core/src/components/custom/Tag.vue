<script setup lang="ts">
import { XIcon } from "@lucide/vue"

import Label from "@shadcn/ui/label/Label.vue"

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  //   delete: {
  //     type: Function,
  //     required: true,
  //   },
})

const emit = defineEmits(["delete"])
</script>

<template>
  <Label
    class="bg-secondary data-[state=active]:ring-ring ring-offset-background m-1 flex h-5 w-fit items-center rounded-md data-[state=active]:ring-2 data-[state=active]:ring-offset-2"
  >
    <span class="rounded bg-transparent py-0.5 pl-2 text-sm select-text hover:cursor-text">{{ label }}</span>
    <XIcon class="mr-1 flex h-4 w-4 rounded bg-transparent hover:cursor-pointer" @click="emit('delete')" />
  </Label>
</template>
