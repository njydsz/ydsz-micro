<script lang="ts" setup>
/**
 * * Progress（progress）组件 —— 统一进度入口，按 type 分发到不同原语实现。
 * *
 * * - type === 'linear'（默认）：线性进度条（YdProgress, 基于 Radix ProgressRoot）
 * * - type === 'circle'：圆形进度环（YdProgressCircle, 双 SVG circle）
 * * - type === 'dashboard'：仪表盘进度（YdProgressDashboard, 半圆 SVG path）
 * *
 * * @path comm\@core\ui-kit\ydsz-ui\src\ui\progress\progress.vue
 * * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed } from 'vue';

import YdProgress from './YdProgress.vue';
import YdProgressCircle from './YdProgressCircle.vue';
import YdProgressDashboard from './YdProgressDashboard.vue';

import { useReducedMotion } from '../../motion/useReducedMotion';

import type { ProgressProps } from './progress-types';

defineOptions({ name: 'YdProgress' });

const props = withDefaults(defineProps<ProgressProps>(), {
  type: 'linear',
  value: 0,
  size: undefined,
  strokeWidth: undefined,
  color: undefined,
  trackColor: undefined,
  showInfo: true,
  indeterminate: false,
  barClass: undefined,
  class: undefined,
});

const emit = defineEmits<{
  done: [];
}>();

const { reduced } = useReducedMotion();

/** 向 primitives 传递的最终类名：运动抑制时附加标记 */
const finalClass = computed(() => {
  if (!reduced.value) return props.class;
  const base = typeof props.class === 'string' ? props.class : '';

  return [base, 'yd-progress--reduce-motion'].filter(Boolean);
});

/** circle 默认 size */
const circleSize = computed(() => props.size ?? 80);
/** circle 默认 strokeWidth */
const circleStroke = computed(() => props.strokeWidth ?? 6);

/** dashboard 默认 size */
const dashboardSize = computed(() => props.size ?? 120);
/** dashboard 默认 strokeWidth */
const dashboardStroke = computed(() => props.strokeWidth ?? 8);

/** linear bar 类名：运动抑制时附加标记 */
const linearBarClass = computed(() => {
  if (!reduced.value) return props.barClass;
  const base = typeof props.barClass === 'string' ? props.barClass : '';

  return [base, 'yd-progress-bar--reduce-motion'].filter(Boolean);
});
</script>

<template>
  <!-- 线性 -->
  <YdProgress
    v-if="props.type === 'linear'"
    :class="finalClass"
    :percentage="props.value"
    :indeterminate="props.indeterminate"
    :bar-class="linearBarClass"
    @done="emit('done')"
  />

  <!-- 圆形 -->
  <YdProgressCircle
    v-else-if="props.type === 'circle'"
    :class="finalClass"
    :value="props.value"
    :size="circleSize"
    :stroke-width="circleStroke"
    :color="props.color"
    :track-color="props.trackColor"
    :show-info="props.showInfo"
  />

  <!-- 仪表盘 -->
  <YdProgressDashboard
    v-else
    :class="finalClass"
    :value="props.value"
    :size="dashboardSize"
    :stroke-width="dashboardStroke"
    :color="props.color"
    :track-color="props.trackColor"
    :show-info="props.showInfo"
  />
</template>

<style scoped>
/* 用户在系统中开启「减少动画」偏好时，丢弃所有过渡/动画 */
.yd-progress--reduce-motion :deep(*) {
  transition: none !important;
  animation: none !important;
}

.yd-progress-bar--reduce-motion {
  transition: none !important;
  animation: none !important;
}
</style>
