<script setup lang="ts">
import { useTemplateRef } from "vue"

defineProps({
  audioSrc: {
    type: String,
    required: true,
  },
})

const audioEl = useTemplateRef<HTMLAudioElement>("audioEl")

/** 播放铃声 */
const play = () => {
  if (audioEl.value) {
    audioEl.value.play()
  }
}

/** 暂停播放铃声 */
const pause = () => {
  if (audioEl.value) {
    audioEl.value.pause()
  }
}

/** 获取音频是否暂停 */
const isPaused = () => {
  return audioEl.value?.paused || false
}

defineExpose<{
  /** 播放铃声 */
  play: () => void
  /** 暂停播放铃声 */
  pause: () => void
  /** 获取音频是否暂停 */
  isPaused: () => boolean
}>({
  play,
  pause,
  isPaused,
})
</script>

<template>
  <audio ref="audioEl" :src="audioSrc" loop></audio>
</template>

<style scoped></style>
