<template>
  <div id="loading-mask">
    <svg viewBox="0 0 1800 900" xmlns="http://www.w3.org/2000/svg">
      <!-- 图片 -->
      <image href="/favicon.png" x="900" y="350" width="200" height="200" transform="translate(-100,-200)" />
      <!-- 文字 -->
      <text x="900" y="450" font-size="70">muxidream</text>
      <!-- 文字 -->
      <text x="900" y="600" font-size="140">tauri系统</text>
      <!-- 文字 -->
      <text x="900" y="700" font-size="30">型号：muxidream</text>
      <!-- 文字 -->
      <text x="900" y="750" font-size="30">版本号：</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useTransition } from "@vueuse/core"
import { toRef } from "vue"

const props = defineProps({
  percent: {
    type: Number,
    default: 0,
  },
  text: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["close"])

const percentRef = toRef(props, "percent")

const outputValue = useTransition(percentRef, {
  duration: 1000,
  easing: [0.75, 0, 0.25, 1],
})

const colors = [
  { color: "#ff0000", percentage: 20 }, // 红
  { color: "#ff7f00", percentage: 40 }, // 橙
  { color: "#ffff00", percentage: 60 }, // 黄
  { color: "#7fff00", percentage: 80 }, // 浅绿
  { color: "#00ff00", percentage: 100 }, // 绿
]
</script>

<style scoped>
/*#region 以下是网站加载动画的样式*/
#loading-mask {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  user-select: none;
  z-index: 9999;
  overflow: hidden;
  background-color: #fff;
  transition: opacity 0.3s ease;
}

/* 根据当前是否是黑夜模式更换加载动画背景颜色 */
.dark #loading-mask {
  background-color: #fff;
}

#loading-mask > svg {
  width: 100%;
  height: 87%;
  overflow: hidden;
}

#loading-mask > svg > text {
  text-anchor: middle;
  dominant-baseline: middle;
  text-transform: uppercase;
  animation: stroke 2s infinite alternate;
  letter-spacing: 0.25rem;
}

.progress {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
}
/*#endregion*/
</style>
