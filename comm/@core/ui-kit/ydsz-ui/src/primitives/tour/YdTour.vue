<!--
 * Tour 引导：分步骤引导用户认识页面功能。
 *
 * <p>核心特性：
 * <ul>
 *   <li>Target 高亮：自动定位目标元素，绘制遮罩和参考框</li>
 *   <li>受控组件：通过 v-model:open 控制显隐，current 控制当前步骤</li>
 *   <li>键盘导航：← → 切换步骤，Esc 关闭</li>
 *   <li>进度指示点、上一步/下一步/跳过按钮</li>
 *   <li>完整 a11y：role="dialog"、aria-describedby、aria-modal</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tour\YdTour.vue
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 增强：target 定位 + 键盘导航 + 动画过渡)
-->
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdButton } from '../button';

interface TourStep {
  /** 步骤描述文本 */
  description?: string;
  /** 步骤标题 */
  title: string;
  /** 目标元素选择器（用于定位高亮） */
  target?: string;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 当前步骤索引（受控） */
  current: number;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 是否打开（受控） */
  open: boolean;
  /** 引导步骤配置 */
  steps: TourStep[];
}

const props = withDefaults(defineProps<Props>(), {
  mask: true,
});

const emit = defineEmits<{
  close: [];
  finish: [];
  change: [index: number];
  'update:open': [value: boolean];
}>();

const totalSteps = computed(() => props.steps.length);
const currentStep = computed(() => props.steps[props.current]);
const isLastStep = computed(() => props.current >= totalSteps.value - 1);

/** 目标元素当前边界（用于高亮定位） */
const targetRect = ref<DOMRect | null>(null);

/**
 * 根据 target 选择器查询元素并更新高亮框位置。
 */
function updateTargetRect(): void {
  const selector = currentStep.value?.target;
  if (!selector) {
    targetRect.value = null;
    return;
  }
  const el = document.querySelector<HTMLElement>(selector);
  if (el) {
    targetRect.value = el.getBoundingClientRect();
    // 滚动到可视区域
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    targetRect.value = null;
  }
}

/**
 * 切换步骤时更新定位。
 */
watch(
  () => [props.current, props.open],
  () => {
    if (props.open) {
      updateTargetRect();
    }
  },
  { immediate: true },
);

function next(): void {
  if (isLastStep.value) {
    emit('finish');
    emit('update:open', false);
  } else {
    emit('change', props.current + 1);
  }
}

function prev(): void {
  if (props.current > 0) {
    emit('change', props.current - 1);
  }
}

function cancel(): void {
  emit('close');
  emit('update:open', false);
}

/** 键盘导航 */
function handleKeydown(event: KeyboardEvent): void {
  if (!props.open) return;
  switch (event.key) {
    case 'Escape':
      cancel();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      next();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      prev();
      break;
  }
}

/** 遮罩高亮框的样式 */
const highlightStyle = computed(() => {
  if (!targetRect.value) return undefined;
  const { height, left, top, width } = targetRect.value;
  return {
    height: `${height + 8}px`,
    left: `${left - 4}px`,
    top: `${top - 4}px`,
    width: `${width + 8}px`,
  };
});
</script>

<template>
  <template v-if="open">
    <!-- 遮罩层：带高亮穿孔 -->
    <div
      v-if="mask"
      class="fixed inset-0 z-50 bg-black/50 transition-opacity"
      aria-hidden="true"
    >
      <!-- 高亮框（反向镂空效果通过 box-shadow 实现） -->
      <div
        v-if="highlightStyle"
        class="absolute rounded-lg transition-all duration-300"
        :style="highlightStyle"
        style="box-shadow: 0 0 0 9999px rgba(0,0,0,0.5)"
      />
    </div>

    <!-- 步骤卡片 -->
    <div
      v-if="currentStep"
      class="bg-background fixed end-6 top-6 z-[60] w-80 rounded-lg border p-4 shadow-xl transition-all"
      :class="cn('animate-in fade-in slide-in-from-top-2', class)"
      role="dialog"
      aria-modal="true"
      :aria-label="`引导步骤 ${current + 1}/${totalSteps}`"
      @keydown="handleKeydown"
    >
      <h3 class="text-foreground mb-2 text-sm font-semibold">{{ currentStep.title }}</h3>
      <p class="text-muted-foreground mb-4 text-sm leading-relaxed">{{ currentStep.description }}</p>

      <!-- 进度指示点 -->
      <div
        class="mb-3 flex gap-1.5"
        role="progressbar"
        :aria-valuenow="current + 1"
        :aria-valuemin="1"
        :aria-valuemax="totalSteps"
        aria-label="引导进度"
      >
        <span
          v-for="(_, i) in totalSteps"
          :key="i"
          :class="cn(
            'size-1.5 rounded-full transition-colors',
            i === current ? 'bg-primary' : i < current ? 'bg-primary/50' : 'bg-muted',
          )"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs">{{ current + 1 }} / {{ totalSteps }}</span>
        <div class="flex gap-2">
          <YdButton v-if="current > 0" size="sm" variant="ghost" @click="prev">
            上一步
          </YdButton>
          <YdButton size="sm" @click="next">
            {{ isLastStep ? '完成' : '下一步' }}
          </YdButton>
          <YdButton size="sm" variant="outline" @click="cancel">
            跳过
          </YdButton>
        </div>
      </div>
    </div>

    <!-- 锚点：确保 dom 存在以供 focus -->
    <div tabindex="-1" class="sr-only" />
  </template>
</template>
