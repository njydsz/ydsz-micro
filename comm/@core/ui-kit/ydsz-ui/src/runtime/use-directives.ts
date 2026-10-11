/**
 * ydsz-ui 全局指令运行时注册 —— 供 Nuxt 模块通过 addPlugin 注入。
 *
 * 包含 Ripple 涟漪效果指令与 ClickOutside 点击外部指令，
 * 在客户端挂载时自动注册为 Vue 全局指令。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\runtime\use-directives.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { defineNuxtPlugin } from '#app'
import type { App, DirectiveBinding } from 'vue'

/**
 * Ripple 指令参数
 * - `v-ripple` 默认启用
 * - `v-ripple.center` 从中心扩散
 * - `v-ripple="{ color: 'rgba(0,0,0,.15)' }"` 自定义颜色
 */
interface RippleOptions {
  color?: string
  rippleClass?: string
}

interface RippleHTMLElement extends HTMLElement {
  _rippleHandler?: (e: MouseEvent) => void
}

/**
 * v-ripple 指令：在元素上产生 Material 风格的点击涟漪效果
 */
const RippleDirective = {
  mounted(el: RippleHTMLElement, binding: DirectiveBinding<RippleOptions | boolean | undefined>) {
    if (typeof window === 'undefined') return

    const isCenter = binding.modifiers?.center
    const options: RippleOptions = typeof binding.value === 'object' && binding.value !== null
      ? binding.value
      : {}

    el.classList.add('yd-ri')
    if (options.rippleClass) {
      el.classList.add(options.rippleClass)
    }
    el.style.position = el.style.position || 'relative'
    el.style.overflow = el.style.overflow || 'hidden'

    el._rippleHandler = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = isCenter ? rect.width / 2 : event.clientX - rect.left
      const y = isCenter ? rect.height / 2 : event.clientY - rect.top

      const ripple = document.createElement('span')
      ripple.className = 'yd-rd'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x - size / 2}px`
      ripple.style.top = `${y - size / 2}px`

      if (options.color) {
        ripple.style.backgroundColor = options.color
      }

      el.appendChild(ripple)

      const cleanup = () => {
        ripple.removeEventListener('animationend', cleanup)
        ripple.remove()
      }
      ripple.addEventListener('animationend', cleanup)

      // Fallback: force cleanup after 800ms if animationend never fires
      setTimeout(() => {
        if (ripple.isConnected) ripple.remove()
      }, 800)
    }

    el.addEventListener('pointerdown', el._rippleHandler, { passive: true })
  },

  unmounted(el: RippleHTMLElement) {
    if (el._rippleHandler) {
      el.removeEventListener('pointerdown', el._rippleHandler)
      delete el._rippleHandler
    }
    el.classList.remove('yd-ri')
  },
} as const

/**
 * v-click-outside 指令：在元素外部触发点击时回调
 *
 * 用法：
 * ```vue
 * <div v-click-outside="handleClickOutside">...</div>
 * ```
 * ```vue
 * <div v-click-outside:[delay]="handleClickOutside">...</div>
 * ```
 */
interface ClickOutsideHTMLElement extends HTMLElement {
  _clickOutsideHandler?: (e: MouseEvent) => void
}

const ClickOutsideDirective = {
  mounted(el: ClickOutsideHTMLElement, binding: DirectiveBinding<(e: MouseEvent) => void | boolean | undefined>) {
    if (typeof window === 'undefined') return

    const delay = binding.arg ? Number(binding.arg) : 0

    el._clickOutsideHandler = (event: MouseEvent) => {
      const handler = binding.value
      if (typeof handler !== 'function') return

      if (el === event.target || el.contains(event.target as Node)) return

      const callback = () => handler(event)
      if (delay > 0) {
        setTimeout(callback, delay)
      } else {
        callback()
      }
    }

    // Use capture so it fires before bubbling events
    document.addEventListener('pointerdown', el._clickOutsideHandler, true)
  },

  unmounted(el: ClickOutsideHTMLElement) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('pointerdown', el._clickOutsideHandler, true)
      delete el._clickOutsideHandler
    }
  },
} as const

/**
 * 在 Nuxt App 上注册全局指令
 *
 * 使用：在 nuxt.config.ts 中通过 addPlugin 注入本文件
 */
function registerDirectives(app: App) {
  app.directive('ripple', RippleDirective)
  app.directive('click-outside', ClickOutsideDirective)
}

/**
 * Nuxt 插件入口 —— 在客户端自动注册全局指令。
 *
 * 组件用法：
 * ```vue
 * <YdButton v-ripple>Click me</YdButton>
 * <div v-click-outside="close">Panel content</div>
 * ```
 */
export default defineNuxtPlugin((_nuxtApp) => {
  registerDirectives(_nuxtApp.vueApp)
})

// 也暴露给非 Nuxt 环境使用
export { registerDirectives, RippleDirective, ClickOutsideDirective }
export type { RippleOptions }
