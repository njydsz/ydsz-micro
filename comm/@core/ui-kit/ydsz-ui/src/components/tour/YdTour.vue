<!--
 * YdTour —— 漫游引导主控制器。
 *
 * 对标 EP Tour / ANT Tour 的完整引导能力：
 * - 顺序导航（v-model 步骤索引 + v-model:visible）
 * - DOM 目标定位：根据 target 选择器查询元素，获取 bounding rect 实时定位
 * - 自动面板布局：动态计算面板偏移位置，确保不超出视口
 * - 蒙版 + 高亮：遮罩层 + spotlight 效果照亮目标元素
 * - 键盘导航：Escape 关闭、ArrowRight/ArrowLeft 上一步/下一步
 * - resize 监听：window 尺寸变化时重新定位
 * - a11y：role="dialog" aria-modal 完整支持
 *
 * @module primitives/tour/YdTour
 * @author ydsz-team
 * @since 1.0.0 (26.10.10 重构：完整 Tour 控制器)
-->

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import type { PopoverPlacement, TourPopoverStyle, TourStep } from './tour-types';
import type { YdTourEmits, YdTourProps } from './tour-types';
import YdTourMask from './YdTourMask.vue';
import YdTourStep from './YdTourStep.vue';

const props = withDefaults(defineProps<YdTourProps>(), {
  modelValue: 0,
  visible: false,
  mask: true,
  closeOnClickMask: false,
  prevText: '上一步',
  nextText: '下一步',
  skipText: '跳过',
  finishText: '完成',
});

const emit = defineEmits<YdTourEmits>();

// ─── 状态 ───

const targetRect = ref<DOMRect | null>(null);

const popoverStyle = ref<TourPopoverStyle>({
  left: 0,
  top: 0,
  actualPlacement: 'bottom',
});

const activePlacement = ref<PopoverPlacement>('bottom');
const transitioning = ref(false);

// ─── 派生 ───

const currentIndex = computed(() => props.modelValue);
const totalSteps = computed(() => props.steps.length);
const currentStep = computed<TourStep | undefined>(() => props.steps[props.modelValue] as TourStep | undefined);

// ─── 目标元素查询 ───

function resolveTarget(target: TourStep['target']): HTMLElement | null {
  if (typeof target === 'function') {
    try {
      return target();
    } catch {
      return null;
    }
  }
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target);
  }
  return null;
}

// ─── 面板定位逻辑 ───

function computePopoverPosition(rect: DOMRect, placement: PopoverPlacement): TourPopoverStyle {
  const panelWidth = 288;
  const panelHeight = 160;
  const gap = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = 0;
  let top = 0;
  let actualPlacement: PopoverPlacement = placement;

  const parts = placement.split('-') as [string, string?];
  const side = parts[0];
  const alignment = parts[1];

  if (side === 'bottom') {
    top = rect.bottom + gap;
    if (alignment === 'start') {
      left = rect.left;
    } else if (alignment === 'end') {
      left = rect.right - panelWidth;
    } else {
      left = rect.left + (rect.width - panelWidth) / 2;
    }
  } else if (side === 'top') {
    top = Math.max(0, rect.top - panelHeight - gap);
    if (alignment === 'start') {
      left = rect.left;
    } else if (alignment === 'end') {
      left = rect.right - panelWidth;
    } else {
      left = rect.left + (rect.width - panelWidth) / 2;
    }
  } else if (side === 'right') {
    left = rect.right + gap;
    if (alignment === 'start') {
      top = rect.top;
    } else if (alignment === 'end') {
      top = Math.max(0, rect.bottom - panelHeight);
    } else {
      top = rect.top + (rect.height - panelHeight) / 2;
    }
  } else if (side === 'left') {
    left = Math.max(0, rect.left - panelWidth - gap);
    if (alignment === 'start') {
      top = rect.top;
    } else if (alignment === 'end') {
      top = Math.max(0, rect.bottom - panelHeight);
    } else {
      top = rect.top + (rect.height - panelHeight) / 2;
    }
  }

  // 视口边界碰撞
  if (left < 8) {
    left = 8;
  } else if (left + panelWidth > viewportWidth - 8) {
    left = viewportWidth - panelWidth - 8;
  }
  if (top < 8) {
    top = 8;
  } else if (top + panelHeight > viewportHeight - 8) {
    top = viewportHeight - panelHeight - 8;
  }

  return { left: Math.max(0, left), top: Math.max(0, top), actualPlacement };
}

// ─── 更新定位 ───

async function updatePosition(): Promise<void> {
  const step = currentStep.value;
  if (!step) {
    targetRect.value = null;
    return;
  }

  const el = resolveTarget(step.target);
  if (!el) {
    targetRect.value = null;
    popoverStyle.value = {
      left: (window.innerWidth - 288) / 2,
      top: (window.innerHeight - 160) / 2,
      actualPlacement: 'bottom',
    };
    return;
  }

  const rect = el.getBoundingClientRect();
  targetRect.value = rect;
  activePlacement.value = step.placement ?? 'bottom';

  await nextTick();

  const placement = activePlacement.value;
  popoverStyle.value = computePopoverPosition(rect, placement);
}

// ─── 步骤切换 ───

function goToStep(index: number): void {
  const clamped = Math.max(0, Math.min(index, totalSteps.value - 1));
  if (clamped === currentIndex.value) {
    updatePosition();
    return;
  }
  emit('update:modelValue', clamped);
}

function handleNext(): void {
  if (transitioning.value) return;
  if (currentIndex.value >= totalSteps.value - 1) {
    handleFinish();
    return;
  }
  transitioning.value = true;
  goToStep(currentIndex.value + 1);
  setTimeout(() => {
    transitioning.value = false;
  }, 300);
}

function handlePrev(): void {
  if (transitioning.value) return;
  if (currentIndex.value <= 0) return;
  transitioning.value = true;
  goToStep(currentIndex.value - 1);
  setTimeout(() => {
    transitioning.value = false;
  }, 300);
}

function handleFinish(): void {
  emit('finish');
  emit('update:visible', false);
}

function handleClose(): void {
  emit('close');
  emit('update:visible', false);
}

// ─── watch ───

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        updatePosition();
      });
    }
  },
);

watch(
  () => props.modelValue,
  (newIndex, oldIndex) => {
    if (newIndex !== oldIndex && props.visible) {
      nextTick(() => {
        updatePosition();
      });
      const step = props.steps[newIndex];
      if (step) {
        emit('change', newIndex, step);
      }
    }
  },
);

// ─── 键盘导航 ───

function handleKeydown(event: KeyboardEvent): void {
  if (!props.visible) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      handleClose();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      handleNext();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      handlePrev();
      break;
  }
}

// ─── 生命周期 ───

onMounted(() => {
  if (props.visible) {
    updatePosition();
  }
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('keydown', handleKeydown);
});

// ─── 派生子组件属性 ───

const shouldShowMask = computed(() => {
  const step = currentStep.value;
  if (step && step.mask !== undefined) {
    return step.mask;
  }
  return props.mask;
});

const effectiveCloseOnClickMask = computed(() => {
  const step = currentStep.value;
  if (step && step.closeOnClickMask !== undefined) {
    return step.closeOnClickMask;
  }
  return props.closeOnClickMask;
});
</script>

<template>
  <div ref="containerRef">
    <slot :current="currentIndex" :step="currentStep" />

    <template v-if="props.visible">
      <YdTourMask
        :rect="targetRect"
        :show="shouldShowMask"
        :closable="effectiveCloseOnClickMask"
        :z-index="1000"
        @click-mask="handleClose"
      />

      <YdTourStep
        v-if="currentStep"
        :step="currentStep"
        :current-index="currentIndex"
        :total-steps="totalSteps"
        :style="{ left: popoverStyle.left + 'px', top: popoverStyle.top + 'px' }"
        :global-prev-text="prevText"
        :global-next-text="nextText"
        :global-skip-text="skipText"
        :global-finish-text="finishText"
        :z-index="1010"
        @next="handleNext"
        @prev="handlePrev"
        @finish="handleFinish"
        @close="handleClose"
      />
    </template>
  </div>
</template>

<style scoped>
</style>