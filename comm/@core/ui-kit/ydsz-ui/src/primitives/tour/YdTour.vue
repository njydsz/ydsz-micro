<!--
 * Tour 引导：分步骤引导用户认识页面功能。
 *
 * 受控组件：通过 v-model:open 控制显隐，current 控制当前步骤。
 * 提供 mask（遮罩）+ popover（步骤卡片）两件核心 UI 元素。
 * target 高亮基于绝对定位 overlay（后续由 TourProvider 替代计算位置）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tour\YdTour.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdButton } from '../button';

interface TourStep {
  description?: string;
  title: string;
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

function next(): void {
  if (props.current >= totalSteps.value - 1) {
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
</script>

<template>
  <template v-if="props.open">
    <!-- 遮罩层 -->
    <div
      v-if="props.mask"
      class="fixed inset-0 z-50 bg-black/40 transition-opacity"
      aria-hidden="true"
    ></div>

    <!-- 步骤卡片 -->
    <div
      v-if="currentStep"
      class="bg-background fixed right-6 top-6 z-[60] w-80 rounded-lg border p-4 shadow-xl"
      :class="props.class"
      role="dialog"
      aria-modal="true"
      :aria-label="`第 ${props.current + 1} 步引导`"
    >
      <h3 class="text-foreground mb-2 text-sm font-semibold">{{ currentStep.title }}</h3>
      <p class="text-muted-foreground mb-4 text-sm">{{ currentStep.description }}</p>

      <!-- 进度指示点 -->
      <div class="mb-3 flex gap-1.5" role="progressbar" :aria-valuenow="props.current + 1" :aria-valuemin="1" :aria-valuemax="totalSteps">
        <span
          v-for="(_, i) in totalSteps"
          :key="i"
          :class="cn('size-1.5 rounded-full transition-colors', i === props.current ? 'bg-primary' : 'bg-muted')"
        ></span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs">{{ props.current + 1 }} / {{ totalSteps }}</span>
        <div class="flex gap-2">
          <YdButton v-if="props.current > 0" size="sm" variant="ghost" @click="prev">上一步</YdButton>
          <YdButton size="sm" @click="next">
            {{ props.current >= totalSteps - 1 ? '完成' : '下一步' }}
          </YdButton>
          <YdButton size="sm" variant="outline" @click="cancel">跳过</YdButton>
        </div>
      </div>
    </div>
  </template>
</template>
