<script setup lang="ts">
/**
 * 文字滚动动画组件
 * - 将插槽中的文字拆分成单个字符，每个字符独立进行上下滚动动画。
 * - 不支持传入参数动态变化，仅初次渲染有效
 * - 模仿自 animejs 创建的动画，示例如 ./Original.vue
 */
import { onMounted, onBeforeUnmount, useTemplateRef } from "vue"

import { createIndependentAnimations } from "./splitTextTool"

const textRef = useTemplateRef<HTMLElement>("textRef")

let animations: gsap.core.Tween[] = []

const props = defineProps({
  /** 相邻字符的动画最小间隔时间(S) */
  each: {
    type: Number,
    default: 0.15,
  },
  /** 从哪个方向开始（"end" | "center" | "edges"暂未实现） */
  from: {
    type: String as PropType<"start" | "random">,
    default: "random",
  },
  /** 每个动画的持续时间(S) */
  duration: {
    type: Number,
    default: 1.3,
  },
  /** 缓动效果 */
  ease: {
    type: String as PropType<string | gsap.EaseFunction>,
    default: "power2.inOut",
  },
  /** 重复次数(默认-1循环) */
  repeat: {
    type: Number,
    default: -1,
  },
  /** 重复间隔时间(S) */
  repeatDelay: {
    type: Number,
    default: 0.3,
  },
})

onMounted(() => {
  if (!textRef.value) return

  animations = createIndependentAnimations(textRef.value, props)
})

onBeforeUnmount(() => {
  animations.forEach((animation) => animation.kill())
})
</script>

<template>
  <span ref="textRef">
    <slot />
  </span>
</template>
