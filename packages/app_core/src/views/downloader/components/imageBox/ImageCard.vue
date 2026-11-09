<script setup lang="ts">
import { Check } from "@lucide/vue"

import useRole from "@app/core/hooks/useRole"
import { formatWallpaperPreviewSrc } from "@app/core/utils/wallpaper"
import { Badge } from "@shadcn/ui/badge"
import { Skeleton } from "@shadcn/ui/skeleton"

import type { WallpaperSearchResponse } from "@app/core/apis/wallpaper/type"

type Wallpaper = WallpaperSearchResponse["wallpaper_list"][number]

const props = defineProps({
  image: {
    type: Object as PropType<Wallpaper>,
  },
  loaded: {
    type: Function as PropType<(item: Wallpaper) => boolean>,
    required: true,
  },
  selecting: Boolean,
  selected: Boolean,
})

const emit = defineEmits(["load"])

const { getRoleNameListByIds } = useRole()

/**
 * 角色名展示串
 *
 * 瀑布流在容器尺寸变化时会把可见卡片整体重渲染，模板里直接调函数等于每次渲染都重算一遍；
 * 这里用 computed 缓存，只有角色数据或当前壁纸变化时才真正重算
 */
const roleNames = computed(() => (props.image ? getRoleNameListByIds(props.image.role_ids).join(",") : ""))
</script>

<template>
  <!--
    data-context-* 挂在卡片上而不是 img 上：
    .card-bg 是 pointer-events: none，右键命中的目标始终是卡片本身
  -->
  <div
    v-if="image"
    class="card"
    :class="{ 'is-selecting': selecting, 'is-selected': selected }"
    data-context-menu="image"
    :data-context-src="image.img_url"
    :data-context-name="image.name"
  >
    <div v-if="selecting" class="selection-mask" />
    <Badge v-if="selecting && selected" class="selection-check"><Check :stroke-width="4" /></Badge>
    <Skeleton v-if="!loaded(image)" class="skeleton" />
    <!--
      loading="lazy" 必须保留：它是离屏图片不发起请求的最后一道保险。
      虚拟化生效时 DOM 本来就只剩视口附近的几十张，lazy 的代价可以忽略；
      一旦虚拟窗口因为容器尺寸异常而失效（历史问题），没有它就会一次放出上千个请求。
      decoding="async" 让解码不阻塞主线程
    -->
    <picture class="card-bg absolute" :class="{ 'is-landscape': image.width > image.height }">
      <source :srcset="formatWallpaperPreviewSrc(image.img_path)" type="image/webp" />
      <img :src="image.img_url" :alt="image.name" loading="lazy" decoding="async" draggable="false" @load="emit('load', image)" />
    </picture>

    <div class="content">
      <!-- <h2 class="title">{{ image.name }}</h2> -->
      <p class="role-name">{{ roleNames }}</p>
      <!-- <button class="btn">{{ image.id }}</button> -->
    </div>
  </div>
</template>

<style scoped>
/* Card Hover Interactions
Original by Ryan Mulligan (@hexagoncircle)
https://codepen.io/hexagoncircle/pen/XWbWKwL
Modified for Vue component usage */

:root {
  /* todo 更换 */
  --font-sans: sans-serif;
  --font-serif: serif;
}

/*
 * 挂载即淡入
 *
 * 原先用 v-motion-fade-visible-once，它会为每张卡片单独创建一个 IntersectionObserver，
 * 容器尺寸变化时所有目标都要重算交叉（实测这段是瀑布流页面主线程的一大块）。
 * 虚拟列表里卡片挂载时必然在可视区内，所以「进入视口淡入」与「挂载淡入」等价，
 * 用 CSS 动画即可，零 JS、零观察器
 */
@keyframes card-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.card {
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  padding: 1rem;
  width: 100%;
  height: 100%;
  text-align: center;
  color: whitesmoke;
  background-color: whitesmoke;
  animation: card-fade-in 280ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.1),
    0 2px 2px rgba(0, 0, 0, 0.1),
    0 4px 4px rgba(0, 0, 0, 0.1),
    0 8px 8px rgba(0, 0, 0, 0.1),
    0 16px 16px rgba(0, 0, 0, 0.1);
}

.selection-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(0, 0, 0, 0.24);
  pointer-events: none;
}

.is-selected .selection-mask {
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.12);
}

.selection-check {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 3;
  width: 2rem;
  height: 2rem;
}

.skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.card .card-bg {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 100%;
  object-fit: cover; /* 关键：保持比例裁剪填满，不变形 */
  object-position: center center;
  transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1);
  pointer-events: none;
}

/* 新增：当图片是横屏时，垂直居中 */
.card-bg.is-landscape {
  object-position: center top;
}

.card::after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  pointer-events: none;
  background-image: linear-gradient(
    to bottom,
    hsla(0, 0%, 0%, 0) 0%,
    hsla(0, 0%, 0%, 0.009) 11.7%,
    hsla(0, 0%, 0%, 0.034) 22.1%,
    hsla(0, 0%, 0%, 0.072) 31.2%,
    hsla(0, 0%, 0%, 0.123) 39.4%,
    hsla(0, 0%, 0%, 0.182) 46.6%,
    hsla(0, 0%, 0%, 0.249) 53.1%,
    hsla(0, 0%, 0%, 0.32) 58.9%,
    hsla(0, 0%, 0%, 0.394) 64.3%,
    hsla(0, 0%, 0%, 0.468) 69.3%,
    hsla(0, 0%, 0%, 0.54) 74.1%,
    hsla(0, 0%, 0%, 0.607) 78.8%,
    hsla(0, 0%, 0%, 0.668) 83.6%,
    hsla(0, 0%, 0%, 0.721) 88.7%,
    hsla(0, 0%, 0%, 0.762) 94.1%,
    hsla(0, 0%, 0%, 0.79) 100%
  );
  transform: translateY(-100%);
  transition: transform 1.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  transition: transform 700ms cubic-bezier(0.19, 1, 0.22, 1);
  z-index: 1;
}

.content > * + * {
  margin-top: 1rem;
}

.title {
  opacity: 0;
  font-size: 1.3rem;
  font-weight: bold;
  line-height: 1.2;
}

.role-name {
  font-family: var(--font-serif);
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1.35;
}

.btn {
  cursor: pointer;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.65rem;
  font-weight: bold;
  letter-spacing: 0.025rem;
  text-transform: uppercase;
  color: white;
  background-color: black;
  border: none;
}

.btn:hover {
  background-color: #0d0d0d; /* lighten(black, 5%) */
}

.btn:focus {
  outline: 1px dashed yellow;
  outline-offset: 3px;
}

/* 悬停效果 */
@media (hover: hover) and (min-width: 600px) {
  .card {
    container-type: size;
    cursor: pointer;
  }

  .card::after {
    transform: translateY(0);
  }

  .content {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(calc(50cqh - 4.5rem));
  }

  .content > *:not(.title) {
    opacity: 0;
    transform: translateY(1rem);
    transition:
      transform 700ms cubic-bezier(0.19, 1, 0.22, 1),
      opacity 700ms cubic-bezier(0.19, 1, 0.22, 1);
  }

  .card:hover .card-bg,
  .card:focus-within .card-bg {
    transform: scale(104%);
  }

  .card:hover::after,
  .card:focus-within::after {
    transform: translateY(-50%);
  }

  .card:hover .content,
  .card:focus-within .content {
    transform: translateY(-50%);
  }

  .card:hover .content .title {
    opacity: 1;
  }

  .card:hover .content > *:not(.title),
  .card:focus-within .content > *:not(.title) {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 90ms;
  }

  .card:focus-within .card-bg,
  .card:focus-within::after,
  .card:focus-within .content,
  .card:focus-within .content > *:not(.title) {
    transition-duration: 0s;
  }
}

/* 系统开启「减少动态效果」时不播放入场淡入 */
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
  }
}
</style>
