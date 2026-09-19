<!--
 * Affix 固钉：当滚动偏移量>=阈值时将内容固定在视口（或 target 容器）。
 *
 * 实现思路：
 *   - 用 scroll 事件监听 target（默认 window），动态计算当前 offsetTop；
 *   - offset 条件成立后复制占位，内容区定位切换为 fixed；
 *   - 通过 update:change 通知外部固定/释放事件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\affix\affix.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AffixEmits, AffixProps } from './affix-types';

import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

defineOptions({ name: 'YdAffix' });

const props = withDefaults(defineProps<AffixProps>(), {
  offset: 0,
  position: 'top',
  target: undefined,
  zIndex: 100,
});

const emit = defineEmits<AffixEmits>();

/** 占位元素宽度（用于固定后占位） */
const placeholderRef = ref<HTMLElement | null>(null);
/** 内容容器 */
const wrapperRef = ref<HTMLElement | null>(null);
/** 当前是否已固定 */
const isFixed = ref(false);
/** target 元素 */
let targetEl: HTMLElement | Window = window;

/**
 * 更新固定状态。
 * 读取 targetEl scrollTop 与 wrapper offsetTop，与 props.offset 比较。
 */
function updateFixedState(): void {
  if (!placeholderRef.value) return;
  const rect = placeholderRef.value.getBoundingClientRect();
  const targetTop = targetEl === window ? 0 : (targetEl as HTMLElement).getBoundingClientRect().top;
  const currentOffset = rect.top - targetTop;

  const shouldFix = props.position === 'top'
    ? currentOffset <= props.offset
    : false;

  if (shouldFix !== isFixed.value) {
    isFixed.value = shouldFix;
    emit('change', shouldFix);
  }
}

/** 滚动事件监听 */
function onScroll(): void {
  updateFixedState();
}

/** fixed 定位样式 */
const fixedStyle = computed(() => {
  if (!isFixed.value) return {};
  return {
    position: 'fixed',
    [props.position]: `${props.offset}px`,
    zIndex: props.zIndex,
    width: placeholderRef.value ? `${placeholderRef.value.offsetWidth}px` : undefined,
  };
});

onMounted(() => {
  if (props.target) {
    const el = document.querySelector<HTMLElement>(props.target);
    if (el) targetEl = el;
  }
  targetEl.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // 初始判定
  onScroll();
});

onBeforeUnmount(() => {
  targetEl.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
});

watchEffect(() => {
  // offset 变化时重新判定
  if (isFixed.value !== undefined) {
    onScroll();
  }
});
</script>

<template>
  <div ref="wrapperRef" :class="['yd-affix', props.class]">
    <!-- 占位：固定后保持高度撑开 -->
    <div
      v-if="isFixed"
      ref="placeholderRef"
      class="yd-affix__placeholder"
      aria-hidden="true"
    />
    <!-- 内容区 -->
    <div ref="placeholderRef" :style="fixedStyle" class="yd-affix__content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.yd-affix {
  display: block;
}

.yd-affix__placeholder {
  display: block;
  pointer-events: none;
}

.yd-affix__content {
  will-change: transform;
}
</style>
