<!--
 * BackTop 回到顶部：滚动超过阈值后出现，点击平滑滚回顶部。
 *
 * 设计要点：
 * - 监听 scrollY 决定是否显示（带淡入淡出动画）
 * - 点击使用 scrollTo(top, smooth)
 * - 容器可配置（默认 window），通过 getTargetContainer 注入
 * - 滚动节流使用 rAF，避免在 scroll 回调中重排
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\back-top\YdBackTop.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { onBeforeUnmount, onMounted, ref, unref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ArrowUp } from 'lucide-vue-next';

import { YdButton } from '../button';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 点击回调（默认滚至顶部） */
  onClick?: () => void;
  /** 滚动距离触发的阈值（px） */
  visibilityHeight?: number;
  /** 目标滚动容器（默认 window） */
  target?: () => HTMLElement | Window;
  /** z-index */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  visibilityHeight: 300,
  zIndex: 999,
});

const isVisible = ref(false);
const scrollTop = ref(0);
let rafId: number | undefined;

function handleScroll(): void {
  if (rafId !== undefined) return;
  rafId = requestAnimationFrame(() => {
    scrollTop.value = getScrollTop();
    isVisible.value = scrollTop.value >= props.visibilityHeight;
    rafId = undefined;
  });
}

function getScrollTop(): number {
  const target = props.target?.();
  if (!target) return window.scrollY;
  if (target === window) return window.scrollY;
  return (target as HTMLElement).scrollTop;
}

function scrollToTop(): void {
  const target = props.target?.();
  const el = target === undefined ? window : target;
  el.scrollTo({ behavior: 'smooth', top: 0 });
}

function handleClick(): void {
  props.onClick?.() ?? scrollToTop();
}

onMounted(() => {
  const target = props.target?.() ?? window;
  target.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  const target = props.target?.() ?? window;
  target.removeEventListener('scroll', handleScroll);
  if (rafId !== undefined) cancelAnimationFrame(rafId);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    leave-active-class="transition duration-150 ease-in"
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0 translate-y-2"
  >
    <YdButton
      v-show="isVisible"
      :aria-label="'回到顶部'"
      :class="
        cn(
          'fixed bottom-6 right-20 z-[var(--z-fixed)] size-10 rounded-full p-0 shadow-lg',
          props.class,
        )
      "
      variant="outline"
      @click="handleClick"
    >
      <ArrowUp class="size-4" />
      <span v-if="$slots.default" class="ml-1 text-xs">
        <slot></slot>
      </span>
    </YdButton>
  </Transition>
</template>
