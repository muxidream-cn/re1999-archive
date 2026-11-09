import { gsap } from "gsap"

interface SplitTextCloneBottomResult {
  chars: HTMLElement[]
  originals: HTMLElement[]
  clones: HTMLElement[]
  heights: number[]
  revert: () => void
}

/**分割字符，生成复制的文本*/
const splitTextCloneBottom = (element: HTMLElement): SplitTextCloneBottomResult => {
  const originalHTML = element.innerHTML

  const chars: HTMLElement[] = []
  const originals: HTMLElement[] = []
  const clones: HTMLElement[] = []
  const heights: number[] = []

  const text = element.textContent ?? ""

  element.innerHTML = ""

  Array.from(text).forEach((char) => {
    // 空格
    if (char === " ") {
      element.appendChild(document.createTextNode(" "))
      return
    }

    // mask
    const mask = document.createElement("span")

    mask.style.display = "inline-block"
    mask.style.position = "relative"
    mask.style.overflow = "hidden"
    mask.style.verticalAlign = "top"

    // track
    const track = document.createElement("span")

    track.style.display = "block"
    track.style.position = "relative"

    // original
    const original = document.createElement("span")

    original.textContent = char

    original.style.display = "block"
    original.style.whiteSpace = "pre"
    original.style.lineHeight = "inherit"

    // clone
    const clone = document.createElement("span")

    clone.textContent = char

    clone.style.display = "block"
    clone.style.whiteSpace = "pre"
    clone.style.lineHeight = "inherit"

    // 先插入 DOM
    track.appendChild(original)
    track.appendChild(clone)

    mask.appendChild(track)

    element.appendChild(mask)

    // ⭐ 插入 DOM 后再测量
    const height = original.getBoundingClientRect().height

    // mask 是一个字符的高度
    mask.style.height = `${height}px`

    // track 是两个字符的高度
    track.style.height = `${height * 2}px`

    // 保存高度
    heights.push(height)

    chars.push(track)
    originals.push(original)
    clones.push(clone)
  })

  return {
    chars,
    originals,
    clones,
    heights,

    revert() {
      element.innerHTML = originalHTML
    },
  }
}

/**为每个字符单独应用动画效果 */
export const createIndependentAnimations = (
  element: HTMLElement,
  options: {
    /** 相邻字符的动画最小间隔时间(S) */
    each: number
    /** 从哪个方向开始（"end" | "center" | "edges"暂未实现） */
    from?: "start" | "random"
    /** 每个动画的持续时间(S) */
    duration: number
    /** 缓动效果 */
    ease: string | gsap.EaseFunction
    /** 重复次数(-1为循环) */
    repeat: number
    /** 重复间隔时间(S) */
    repeatDelay: number
  }
) => {
  const split = splitTextCloneBottom(element)
  const chars = split.chars
  const heights = split.heights

  const animations: gsap.core.Tween[] = []

  let order = chars.map((_, index) => index)

  if (options.from === "random") {
    order = gsap.utils.shuffle(order)
  }

  order.forEach((charIndex, staggerIndex) => {
    const animation = gsap.to(chars[charIndex], {
      y: -heights[charIndex],
      duration: options.duration,
      ease: options.ease,
      repeat: options.repeat,
      repeatDelay: options.repeatDelay,
      delay: staggerIndex * options.each,
    })

    animations.push(animation)
  })

  return animations
}
