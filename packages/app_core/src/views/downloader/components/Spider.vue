<script setup lang="ts">
import gsap from "gsap"
import { ref, onMounted, onUnmounted, watch } from "vue"

import zhizhu from "@app/core/assets/images/spider/zhizhu.png"
import zhuangshi from "@app/core/assets/images/spider/zhuangshi.png"
import zhusi from "@app/core/assets/images/spider/zhusi.png"
import zhutui from "@app/core/assets/images/spider/zhutui.png"
import zhuwang from "@app/core/assets/images/spider/zhuwang.png"

const props = defineProps({
  /** 顶部容器已滚动的高度 */
  targetHeight: {
    type: Number,
    default: 0,
  },
  /** 缩放倍数(默认为1) */
  scale: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(["toTop"])

const rootRef = ref<HTMLElement | null>(null)
const spiderRef = ref<HTMLElement | null>(null)
const zhusiRef = ref<HTMLImageElement | null>(null)

/** 蜘蛛默认位置 */
const defaultHeight = -130
/** 蜘蛛当前实际位置 */
let spiderCurrentY = defaultHeight
/** 蜘蛛目标位置 */
let spiderTargetY = defaultHeight

/** 当前蜘蛛动画 */
let spiderAnimation: gsap.core.Tween | null = null
/** 蜘蛛腿动画 Timeline */
let legsTimeline: gsap.core.Timeline | null = null
/** GSAP Context */
let ctx: gsap.Context | null = null

/** quickSetter */
let setSpiderY: Function | null = null

let setZhusiHeight: Function | null = null

/** 蜘蛛移动状态 */
const moving = ref(false)

/** 蜘蛛随机散步状态 */
const walking = ref(false)

/** 蜘蛛腿动画配置 */
const animations = [
  {
    selector: ".left_1",
    from: {},
    to: { rotation: -10 },
  },

  {
    selector: ".left_2",
    from: { rotation: -50 },
    to: { rotation: -40 },
  },

  {
    selector: ".left_3",
    from: { rotation: 205 },
    to: { rotation: 215 },
  },

  {
    selector: ".left_4",
    from: { rotation: 125 },
    to: { rotation: 135 },
  },

  {
    selector: ".right_1",
    from: {},
    to: { rotation: 10 },
  },

  {
    selector: ".right_2",
    from: { rotation: 50 },
    to: { rotation: 40 },
  },

  {
    selector: ".right_3",
    from: { rotation: 155 },
    to: { rotation: 145 },
  },

  {
    selector: ".right_4",
    from: { rotation: 235 },
    to: { rotation: 225 },
  },
]

/**
 * 统一更新蜘蛛位置
 * @param y 移动到目标高度
 */
const updateSpiderY = (y: number) => {
  spiderCurrentY = y
  // 更新蜘蛛位置
  setSpiderY?.(y)
  // 更新蛛丝高度
  setZhusiHeight?.(y + 310)
}

/** 蜘蛛静止悬浮动画 */
const spiderHold = () => {
  spiderAnimation?.kill()

  const state = { y: spiderCurrentY }
  const targetY = spiderTargetY + gsap.utils.random(-20, 20)

  spiderAnimation = gsap.to(state, {
    y: targetY,
    duration: 1,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    onUpdate: () => {
      updateSpiderY(state.y)
    },
  })
}

/**
 * 蜘蛛移动
 * @param targetHeight 移动到的目标高度
 */
const spiderMove = (targetHeight: number) => {
  moving.value = true

  legsMove()

  // 停止当前悬浮 / 移动动画
  spiderAnimation?.kill()
  const state = { y: spiderCurrentY }

  spiderAnimation = gsap.to(state, {
    y: targetHeight,
    duration: 1,
    ease: "power2.out",
    overwrite: true,
    onUpdate: () => {
      updateSpiderY(state.y)
    },
    onComplete: () => {
      // 保存目标位置
      spiderTargetY = targetHeight
      moving.value = false
      // 恢复腿部速度
      legsHold()
      // 进入悬浮状态
      spiderHold()
    },
  })
}

/** 蜘蛛随机散步 */
const spiderRandomWalk = () => {
  if (moving.value || walking.value) return

  walking.value = true
  legsMove()
  // 停止当前动画
  spiderAnimation?.kill()

  const state = { y: spiderCurrentY }
  const randomTarget = gsap.utils.random(-300, 100)
  // console.log("randomTarget", randomTarget)
  spiderAnimation = gsap.to(state, {
    y: randomTarget,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      updateSpiderY(state.y)
    },
    onComplete: () => {
      walking.value = false
      // 如果外部滚动导致蜘蛛开始移动
      if (moving.value) return
      // 返回默认位置
      spiderMove(defaultHeight)
    },
  })
}

/** 点击蜘蛛返回顶部 */
const spiderBack = () => {
  // 使用误差判断
  const isAtTop = Math.abs(spiderCurrentY - defaultHeight) < 21
  // console.log("isAtTop", spiderCurrentY, defaultHeight, isAtTop)
  // console.log("moving.value , walking.value", moving.value, walking.value)
  if (isAtTop || walking.value) {
    spiderRandomWalk()
  } else {
    emit("toTop")
    spiderMove(defaultHeight)
  }
}

/** 初始化蜘蛛腿动画 */
const initLegsAnimation = () => {
  legsTimeline = gsap.timeline({
    repeat: -1,
    yoyo: true,
    defaults: {
      duration: 1,
      ease: "sine.inOut",
    },
  })

  animations.forEach(({ selector, from, to }) => {
    legsTimeline!.fromTo(selector, from, to, 0)
  })
}

/** 蜘蛛静止(腿正常速度) */
const legsHold = () => {
  legsTimeline?.timeScale(1)
}

/** 蜘蛛移动(腿加快) */
const legsMove = () => {
  legsTimeline?.timeScale(8)
}

/** 监听外部高度变化  */
watch(
  () => props.targetHeight,
  (height) => {
    // 如果正在随机散步，先停止随机动画
    if (walking.value) {
      walking.value = false
    }

    const h = height / props.scale + defaultHeight

    // 加100防止蜘蛛挡住搜索按钮
    spiderMove(h > 400 ? h + 120 : h)
  }
)

/**
 * 窗口尺寸变化期间暂停装饰动画
 *
 * 蜘蛛的腿摆动与悬浮是两条 repeat:-1 的常驻补间，每帧都要写 transform。
 * 拖拽 / 最大化窗口时整页本就在逐帧重排，这两条补间只会额外制造样式失效与 rAF 负载，
 * 所以尺寸变化期间先停下，稳定 300ms 后再继续（视觉上只是蜘蛛静止了一瞬）
 */
let resizeResumeTimer = 0

const suspendDecorAnimation = () => {
  legsTimeline?.pause()
  spiderAnimation?.pause()

  window.clearTimeout(resizeResumeTimer)
  resizeResumeTimer = window.setTimeout(() => {
    resizeResumeTimer = 0
    legsTimeline?.resume()
    spiderAnimation?.resume()
  }, 300)
}

onMounted(() => {
  if (!rootRef.value || !spiderRef.value || !zhusiRef.value) {
    return
  }

  ctx = gsap.context(() => {
    /** 高频修改蜘蛛 Y */
    setSpiderY = gsap.quickSetter(spiderRef.value!, "y", "px")
    /** 高频修改蛛丝高度 */
    setZhusiHeight = gsap.quickSetter(zhusiRef.value!, "height", "px")
    /** 设置初始状态 */
    updateSpiderY(defaultHeight)
    /** 初始化腿动画 */
    initLegsAnimation()
    /** 初始化悬浮动画 */
    spiderHold()
  }, rootRef.value)

  window.addEventListener("resize", suspendDecorAnimation)
})

onUnmounted(() => {
  window.removeEventListener("resize", suspendDecorAnimation)
  window.clearTimeout(resizeResumeTimer)
  resizeResumeTimer = 0

  spiderAnimation?.kill()
  legsTimeline?.kill()
  ctx?.revert()

  spiderAnimation = null
  legsTimeline = null
  ctx = null
})
</script>

<template>
  <div ref="rootRef" class="absolute z-9" :style="`transform: scale(${props.scale})`">
    <div class="spider-bg-container">
      <img :src="zhuwang" />

      <img class="zhuangshi" :src="zhuangshi" />

      <img ref="zhusiRef" class="zhusi" :src="zhusi" />
    </div>

    <div ref="spiderRef" class="spider-container" @click="spiderBack">
      <img class="zhizhu" :src="zhizhu" />

      <img class="zhutui left_1" :src="zhutui" />
      <img class="zhutui left_2" :src="zhutui" />
      <img class="zhutui left_3" :src="zhutui" />
      <img class="zhutui left_4" :src="zhutui" />

      <img class="zhutui right_1" :src="zhutui" />
      <img class="zhutui right_2" :src="zhutui" />
      <img class="zhutui right_3" :src="zhutui" />
      <img class="zhutui right_4" :src="zhutui" />
    </div>
  </div>
</template>

<style scoped>
.spider-bg-container {
  position: relative;
  width: 200px;
  height: 200px;
  z-index: 1;
}

.spider-container {
  position: relative;
  width: 200px;
  height: 200px;
  z-index: 2;
  /* 告诉浏览器这个元素会频繁变化 transform */
  will-change: transform;
  cursor: pointer;
}

.zhuangshi {
  position: absolute;
  top: 42px;
  width: 200px;
}

.zhusi {
  position: absolute;
  width: 3px;
  top: 0;
  left: 99px;

  /* 高频修改 height */
  will-change: height;
}

.zhizhu {
  position: absolute;
  width: 100px;
  left: 50px;
}

.zhutui {
  position: absolute;
  width: 10px;
  height: 30px;
  transform-origin: left bottom;
  will-change: transform;
}

.left_1 {
  left: 49px;
  top: 27px;
}

.left_2 {
  left: 58px;
  top: 52px;
}

.left_3 {
  left: 61px;
  top: 63px;
}

.left_4 {
  left: 62px;
  top: 74px;
  height: 34px;
}

.right_1 {
  left: 141px;
  top: 27px;
}

.right_2 {
  left: 136px;
  top: 46px;
}

.right_3 {
  left: 149px;
  top: 59px;
}

.right_4 {
  left: 144px;
  top: 80px;
  height: 34px;
}
</style>
