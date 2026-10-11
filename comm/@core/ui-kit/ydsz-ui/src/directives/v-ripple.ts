/**
 * v-ripple —— 水波纹指令（基础设施层）
 *
 * 用法：
 * ```html
 * <button v-ripple>点击</button>
 * <button v-ripple="{ color: 'rgba(255,255,255,0.5)', duration: 500 }">自定义</button>
 * <button v-ripple="false">禁用</button>
 * ```
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/directives/v-ripple.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import type { Directive, DirectiveBinding } from 'vue'

// ─── 选项类型 ────────────────────────────────────────────────────────────────

export interface RippleOptions {
  /** 水波纹颜色，默认根据元素 text-color 自动推断 */
  color?: string
  /** 动画时长 (ms)，默认 500 */
  duration?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否从中心扩散，默认 false（从点击位置开始） */
  center?: boolean
}

// ─── 内部类型 ────────────────────────────────────────────────────────────────

type RippleBinding = RippleOptions | boolean

interface RippleElement extends HTMLElement {
  __ripple__?: {
    onClick: (e: PointerEvent) => void
    options: RippleOptions
  }
}

/** 默认浅色水波纹（用于深色背景） */
const DEFAULT_LIGHT = 'rgba(255, 255, 255, 0.3)'
/** 默认深色水波纹（用于浅色背景） */
const DEFAULT_DARK = 'rgba(0, 0, 0, 0.15)'
/** 默认动画时长 */
const DEFAULT_DURATION = 500

// ─── 全局复用：只注入一次 keyframes ──────────────────────────────────────────

let keyframesInjected = false

function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `
    @keyframes ydsz-ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
  keyframesInjected = true
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 根据元素 color 推断水波纹颜色。
 * 如果元素文字颜色亮度高（浅色背景），用深色 ripple；反之用浅色 ripple。
 */
function inferRippleColor(el: HTMLElement): string {
  const style = getComputedStyle(el)
  const color = style.color
  const match = color.match(/\d+/g)
  if (!match || match.length < 3) return DEFAULT_LIGHT
  const [r, g, b] = match.map(Number)
  // W3C 相对亮度公式
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? DEFAULT_DARK : DEFAULT_LIGHT
}

/**
 * 创建水波纹 DOM 元素并触发动画
 */
function createRippleBall(el: HTMLElement, x: number, y: number, options: RippleOptions) {
  const duration = options.duration ?? DEFAULT_DURATION
  const color = options.color ?? inferRippleColor(el)

  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)

  const ball = document.createElement('span')
  ball.className = 'ydsz-ripple-ball'
  ball.style.position = 'absolute'
  ball.style.borderRadius = '50%'
  ball.style.pointerEvents = 'none'
  ball.style.backgroundColor = color
  ball.style.width = `${size}px`
  ball.style.height = `${size}px`
  ball.style.opacity = '0.35'
  ball.style.transform = 'scale(0)'
  ball.style.animation = `ydsz-ripple ${duration}ms ease-out forwards`

  if (options.center) {
    ball.style.left = `${rect.width / 2 - size / 2}px`
    ball.style.top = `${rect.height / 2 - size / 2}px`
  } else {
    ball.style.left = `${x - rect.left - size / 2}px`
    ball.style.top = `${y - rect.top - size / 2}px`
  }

  // 动画结束后移除 DOM
  const cleanup = () => ball.remove()
  ball.addEventListener('animationend', cleanup, { once: true })
  ball.addEventListener('webkitAnimationEnd', cleanup, { once: true })

  el.appendChild(ball)
}

// ─── Directive 定义 ──────────────────────────────────────────────────────────

export const vRipple: Directive<HTMLElement, RippleBinding> = {
  mounted(el: RippleElement, binding: DirectiveBinding<RippleBinding>) {
    injectKeyframes()

    // 禁用
    if (binding.value === false) return

    const options: RippleOptions = typeof binding.value === 'object' ? binding.value : {}

    // 确保容器可以约束 ripple
    const style = getComputedStyle(el)
    if (style.position === 'static') {
      el.style.position = 'relative'
    }
    el.style.overflow = 'hidden'

    const onClick = (e: PointerEvent) => {
      const ctx = el.__ripple__
      if (!ctx || ctx.options.disabled) return
      createRippleBall(el, e.clientX, e.clientY, ctx.options)
    }

    el.__ripple__ = { onClick, options }
    el.addEventListener('pointerdown', onClick)
  },

  updated(el: RippleElement, binding: DirectiveBinding<RippleBinding>) {
    if (binding.value === false) {
      if (el.__ripple__) {
        el.removeEventListener('pointerdown', el.__ripple__.onClick)
        delete el.__ripple__
      }
      return
    }

    const options: RippleOptions = typeof binding.value === 'object' ? binding.value : {}
    if (el.__ripple__) {
      el.__ripple__.options = options
    }
  },

  unmounted(el: RippleElement) {
    if (el.__ripple__) {
      el.removeEventListener('pointerdown', el.__ripple__.onClick)
      delete el.__ripple__
    }
  },
}

export default vRipple
