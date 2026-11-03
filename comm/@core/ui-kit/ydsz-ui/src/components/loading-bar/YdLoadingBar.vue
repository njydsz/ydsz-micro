<script lang="ts" setup>
/**
 * 顶部加载进度条：固定在视口顶部，loading 时显示三段式滑动动画。
 *
 * 纯 CSS 动画实现（@keyframes loading-bar-slide），不依赖 JS 逐帧驱动；
 * 颜色 / 高度可配，默认使用主题 primary 色。loading=false 时整条隐藏。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\YdLoadingBar.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { LoadingBarEmits, LoadingBarProps } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdLoadingBar' });

const props = withDefaults(defineProps<LoadingBarProps>(), {
  color: 'hsl(var(--primary))',
  height: 3,
  loading: false,
});

const emit = defineEmits<LoadingBarEmits>();

const barStyle = computed(() => ({
  backgroundColor: props.color,
  height: `${props.height}px`,
}));

function handleClick(event: MouseEvent): void {
  emit('click', event);
}
</script>

<template>
  <div
    v-if="props.loading"
    :class="cn('loading-bar fixed inset-x-0 top-0 z-[var(--z-loading-bar)] overflow-hidden', props.class)"
    :style="barStyle"
    role="progressbar"
    aria-label="Loading"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="50"
    @click="handleClick"
  >
    <div class="loading-bar__indeterminate"></div>
  </div>
</template>

<style scoped>
.loading-bar {
  background-color: transparent;
}

.loading-bar__indeterminate {
  position: absolute;
  inset: 0;
  width: 30%;
  background-color: inherit;
  animation: loading-bar-slide 1.2s ease-in-out infinite;
}

@keyframes loading-bar-slide {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(180%);
  }
  100% {
    transform: translateX(400%);
  }
}
</style>
