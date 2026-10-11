/**
 * v-click-outside —— 点击外部区域指令（基础设施层）
 *
 * 用法：
 * ```html
 * <div v-click-outside="handleClose">...</div>
 * <div v-click-outside="[handlerA, handlerB]">...</div>
 * ```
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/directives/v-click-outside.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import type { Directive, DirectiveBinding } from 'vue'

type ClickOutsideHandler = (event: PointerEvent) => void

interface ClickOutsideElement extends HTMLElement {
  __clickOutside__?: {
    handler: ClickOutsideHandler | ClickOutsideHandler[]
    listener: (e: PointerEvent) => void
  }
}

function createListener(el: ClickOutsideElement): (e: PointerEvent) => void {
  return (e: PointerEvent) => {
    const ctx = el.__clickOutside__
    if (!ctx) return
    const target = e.target as Node
    if (el === target || el.contains(target)) return

    const handlers = Array.isArray(ctx.handler) ? ctx.handler : [ctx.handler]
    for (const h of handlers) {
      h(e)
    }
  }
}

export const vClickOutside: Directive<HTMLElement, ClickOutsideHandler | ClickOutsideHandler[]> = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding<ClickOutsideHandler | ClickOutsideHandler[]>) {
    // 延迟注册，避免刚挂载就触发
    const timer = setTimeout(() => {
      const listener = createListener(el)
      document.addEventListener('pointerdown', listener, true)
      el.__clickOutside__ = {
        handler: binding.value,
        listener,
      }
    }, 0)

    // 保存 timer 以便在 unmounted 时清理
    el.__vClickOutsideTimer__ = timer
  },

  updated(el: ClickOutsideElement, binding: DirectiveBinding<ClickOutsideHandler | ClickOutsideHandler[]>) {
    if (el.__clickOutside__) {
      el.__clickOutside__.handler = binding.value
    }
  },

  unmounted(el: ClickOutsideElement) {
    if ((el as any).__vClickOutsideTimer__) {
      clearTimeout((el as any).__vClickOutsideTimer__)
    }
    if (el.__clickOutside__) {
      document.removeEventListener('pointerdown', el.__clickOutside__.listener, true)
      delete el.__clickOutside__
    }
  },
}

export default vClickOutside
