<script setup lang="ts">
/**
 * 这是由 animejs 创建的原动画
 */
import { createTimeline, splitText, stagger } from "animejs"

const textRef = useTemplateRef("textRef")
const handleClick = async () => {
  if (!textRef.value) return

  const { chars } = splitText(textRef.value, {
    chars: {
      wrap: "clip",
      clone: "bottom",
    },
  })

  createTimeline().add(
    chars,
    {
      y: "-100%",
      loop: true,
      loopDelay: 300,
      duration: 1200,
      ease: "inOut(2)",
    },
    stagger(150, { from: "random" })
  )
}

onMounted(() => handleClick())
</script>

<template>
  <span ref="textRef"> testText </span>
</template>
