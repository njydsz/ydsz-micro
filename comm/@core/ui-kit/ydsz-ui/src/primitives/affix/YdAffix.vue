<!--
 * Affix 固钉：滚动到页面某个位置时吸附固定。
 *
 * 与 Design Affix 对齐：
 * - offsetTop 控制顶部吸附偏移量
 * - offsetBottom 控制底部吸附偏移量
 * - target 可指定容器（默认 window）
 * - 状态变化通过 change 事件通知
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\affix\YdAffix.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 底部吸附偏移量（px） */
  offsetBottom?: number;
  /** 顶部吸附偏移量（px） */
  offsetTop?: number;
  /** 目标滚动容器 */
  target?: () => HTMLElement | null;
}

const props = withDefaults(defineProps<Props>(), {
  offsetBottom: undefined,
  offsetTop: 0,
  target: undefined,
});

const emit = defineEmits<{
  change: [affixed: boolean];
}>();

const containerRef = ref<HTMLElement | null>(null);
const placeholderRef = ref<HTMLElement | null>(null);
const isAffixed = ref(false);
const affixedStyle = ref<Record<string, string>>({});
let observer: IntersectionObserver | null = null;
let rafId: number | undefined;

function getScrollTarget(): HTMLElement | Window {
  const target = props.target?.();
  return target ?? window;
}

function getOffset(el: HTMLElement): { left: number; top: number } {
  let left = 0;
  let top = 0;
  let current: HTMLElement | null = el;
  while (current) {
    left += current.offsetLeft;
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

function handleScroll(): void {
  if (rafId !== undefined) return;
  rafId = requestAnimationFrame(() => {
    const target = getScrollTarget();
    if (!target || !placeholderRef.value) return;
    const rect = placeholderRef.value.getBoundingClientRect();
    const scrollTop =
      target === window ? window.scrollY : (target as HTMLElement).scrollTop;
    const shouldAffix =
      props.offsetTop !== undefined
        ? rect.top <= props.offsetTop
        : false;

    if (shouldAffix !== isAffixed.value) {
      isAffixed.value = shouldAffix;
      emit('change', shouldAffix);
    }

    if (shouldAffix) {
      const containerWidth = placeholderRef.value.offsetWidth;
      const containerHeight = placeholderRef.value.offsetHeight;
      affixedStyle.value = {
        left: `${getOffset(placeholderRef.value).left}px`,
        top: `${props.offsetTop}px`,
        width: `${containerWidth}px`,
      };
    } else {
      affixedStyle.value = {};
    }
    rafId = undefined;
  });
}

onMounted(() => {
  const target = getScrollTarget();
  target.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  const target = getScrollTarget();
  target.removeEventListener('scroll', handleScroll);
  observer?.disconnect();
  if (rafId !== undefined) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div ref="containerRef" :class="cn('relative', props.class)">
    <!-- 占位元素 -->
    <div ref="placeholderRef" :style="isAffixed ? { height: 'var(--affix-h)' } : {}">
      <div :style="isAffixed ? affixedStyle : {}" :class="cn(isAffixed && 'fixed z-50')">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
