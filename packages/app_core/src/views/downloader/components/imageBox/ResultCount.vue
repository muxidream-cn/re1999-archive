<script setup lang="ts">
import { TextRoll } from "@app/core/components/custom/textUI"

defineProps({
  total: {
    type: Number,
    required: true,
  },
})

const isActivated = ref(false)

const handleClick = async (hide: boolean) => {
  isActivated.value = hide
}
</script>

<template>
  <div class="flex h-20 shrink-0 items-center gap-4 text-gray-400 md:h-8">
    <Separator class="flex-1" />
    <TextRoll v-if="isActivated" class="shrink-0 text-sm" @click="handleClick(false)"> Don't forget me ...</TextRoll>
    <span v-else class="shrink-0 text-sm" @click="handleClick(true)"> {{ total }} results. </span>
    <Separator class="flex-1" />
  </div>
</template>
