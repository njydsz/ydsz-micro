<script lang="ts" setup>
/**
 * 顶部加载进度条：固定在视口顶部，支持滑动动画与真实进度两种模式。
 *
 *  - 未传 `loading` 时自动跟随全局 `useLoadingBar` 状态；
 *  - 传入 `progress` 时渲染确定性进度条；
 *  - 颜色 / 高度 / z-index 可配，默认使用主题 primary 色。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\YdLoadingBar.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { LoadingBarEmits, LoadingBarProps } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import {
  loadingBarIsDeterminate,
  loadingBarIsLoading,
  loadingBarProgress,
} from './use-loading-bar';

defineOptions({ name: 'YdLoadingBar' });

const props = withDefaults(defineProps<LoadingBarProps>(), {
  color: 'hsl(var(--primary))',
  height: 3,
  loading: undefined,
  progress: undefined,
  showProgress: false,
  zIndex: undefined,
});

const emit = defineEmits<LoadingBarEmits>();

/** 是否显示（受控优先，否则跟随全局） */
const visible = computed(() => props.loading ?? loadingBarIsLoading.value);

/** 是否确定性进度模式（受控 progress 优先） */
const determinate = computed(() =>
  props.progress !== undefined ? true : loadingBarIsDeterminate.value,
);

/** 当前进度值 */
const currentProgress = computed(() =>
  props.progress !== undefined ? props.progress : loadingBarProgress.value,
);

/** 外层容器样式 */
const barStyle = computed(() => ({
  backgroundColor: determinate.value ? 'transparent' : props.color,
  height: `${props.height}px`,
  ...(props.zIndex !== undefined
    ? { zIndex: typeof props.zIndex === 'number' ? String(props.zIndex) : props.zIndex }
    : {}),
}));

/** 进度条填充样式 */
const fillStyle = computed(() => ({
  backgroundColor: props.color,
  width: `${Math.min(100, Math.max(0, currentProgress.value))}%`,
}));

function handleClick(event: MouseEvent): void {
  emit('click', event);
}
</script>

<template>
  <div
    v-if="visible"
    :class="cn('loading-bar fixed inset-x-0 top-0 overflow-hidden', props.class)"
    :style="barStyle"
    role="progressbar"
    aria-label="Loading"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="determinate ? String(Math.round(currentProgress)) : undefined"
    :aria-valuetext="determinate ? `${Math.round(currentProgress)}%` : undefined"
    @click="handleClick"
  >
    <!-- 确定性进度 -->
    <div
      v-if="determinate"
      class="loading-bar__determinate transition-[width] duration-200 ease-out"
      :style="fillStyle"
    />
    <!-- 滑动动画（indeterminate） -->
    <div v-else class="loading-bar__indeterminate" :style="{ backgroundColor: props.color }" />

    <!-- 进度文案 -->
    <span
      v-if="showProgress && determinate"
      class="loading-bar__text absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white mix-blend-difference"
    >
      {{ Math.round(currentProgress) }}%
    </span>
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
  animation: loading-bar-slide 1.2s ease-in-out infinite;
}

.loading-bar__determinate {
  height: 100%;
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
