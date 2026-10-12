<script lang="ts" setup>
/**
* YdTourStep —— 单一步骤内容面板。
 * 
 * 由 YdTour 内部消费，负责渲染：
 * 1. 步骤标题 + 描述（或自定义 render）
 * 2. 进度指示器（dot 序列）
 * 3. Footer 按钮区（上一步 / 下一步 / 完成 / 跳过）
 * 
 * 本组件不负责定位，定位由 YdTour 控制器传入 CSS left/top。
 * 
 * @module primitives/tour/YdTourStep
 * @author ydsz-team
 * @since 26.10.10
 */
import { computed } from 'vue';

import type { TourStep } from './tour-types';
import { YdButton } from '.././button';

interface Props {
  /** 当前步骤数据 */
  step: TourStep;

  /** 当前步骤索引（0-based） */
  currentIndex: number;

  /** 总步骤数 */
  totalSteps: number;

  /** 面板定位样式 */
  style: {
    left: string;
    top: string;
  };

  /** 全局按钮文字覆盖 */
  globalPrevText: string;
  globalNextText: string;
  globalSkipText: string;
  globalFinishText: string;

  /** 面板 z-index */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  zIndex: 1010,
});

const emit = defineEmits<{
  next: [];
  prev: [];
  finish: [];
  close: [];
}>();

const isFirst = computed(() => props.currentIndex === 0);
const isLast = computed(() => props.currentIndex >= props.totalSteps - 1);

/** 实际显示的按钮文字 */
const prevText = computed(() => props.step.prevText ?? props.globalPrevText);
const nextText = computed(() => props.step.nextText ?? props.globalNextText);
const skipText = computed(() => props.step.skipText ?? props.globalSkipText);
const finishText = computed(() => props.step.finishText ?? props.globalFinishText);
</script>

<template>
  <div
    class="yd-tour-step fixed w-72 rounded-lg border bg-white p-4 shadow-xl transition-all"
    :style="{ left: style.left, top: style.top, zIndex: `${zIndex}` }"
    role="dialog"
    :aria-label="`引导步骤 ${currentIndex + 1}/${totalSteps}`"
    aria-modal="true"
  >
    <!-- 右上角关闭按钮 -->
    <button
      class="yd-tour-step__close absolute right-2 top-2 flex size-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
      type="button"
      :aria-label="skipText"
      @click="emit('close')"
    >
      <svg class="size-3.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <!-- 自定义渲染内容 -->
    <div v-if="step.render" class="yd-tour-step__content">
      <component :is="() => step.render!()" />
    </div>

    <!-- 标准标题 + 描述 -->
    <div v-else>
      <h3
        v-if="step.title"
        class="yd-tour-step__title text-sm font-medium text-neutral-900"
      >
        {{ step.title }}
      </h3>
      <p
        v-if="step.description"
        class="yd-tour-step__description mt-1 text-sm leading-relaxed text-neutral-600"
      >
        {{ step.description }}
      </p>
    </div>

    <!-- 进度指示 dots -->
    <div
      class="yd-tour-step__dots mt-3 flex gap-1.5"
      role="progressbar"
      :aria-valuenow="currentIndex + 1"
      :aria-valuemin="1"
      :aria-valuemax="totalSteps"
      aria-label="引导进度"
    >
      <span
        v-for="(_, i) in totalSteps"
        :key="i"
        class="size-1.5 rounded-full transition-colors"
        :class="
          i === currentIndex
            ? 'bg-blue-500'
            : i < currentIndex
              ? 'bg-blue-500/50'
              : 'bg-neutral-300'
        "
      />
    </div>

    <!-- Footer 按钮区域 -->
    <div class="yd-tour-step__footer mt-3 flex items-center justify-between">
      <span class="text-xs text-neutral-400">
        {{ currentIndex + 1 }} / {{ totalSteps }}
      </span>
      <div class="flex gap-2">
        <YdButton size="sm" variant="ghost" @click="emit('close')">
          {{ skipText }}
        </YdButton>
        <YdButton v-if="!isFirst" size="sm" variant="outline" @click="emit('prev')">
          {{ prevText }}
        </YdButton>
        <YdButton size="sm" @click="isLast ? emit('finish') : emit('next')">
          {{ isLast ? finishText : nextText }}
        </YdButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yd-tour-step {
  animation: yd-tour-step-in 0.2s ease-out;
}

@keyframes yd-tour-step-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
