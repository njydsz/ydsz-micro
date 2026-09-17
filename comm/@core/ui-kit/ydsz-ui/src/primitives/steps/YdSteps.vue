<!--
 * Steps 步骤条：引导用户按流程完成任务。
 *
 * 与 Tabs 不同，Steps 强调流程顺序（wait / process / finish / error 四种状态），
 * 不支持受控切换；步骤跳转由外部通过 `current` prop 控制，click 仅作为可选回调。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\steps\YdSteps.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdStepItem } from './step-item';

/** 单步骤状态 */
export type StepStatus = 'error' | 'finish' | 'process' | 'wait';

/** 单步骤定义 */
export interface StepItem {
  /** 是否禁用（不响应 click） */
  disabled?: boolean;
  /** 错误态描述文案 */
  errorDescription?: string;
  /** 图标插槽名（图标覆盖时使用） */
  icon?: string;
  /** 步骤描述 */
  description?: string;
  /** 步骤状态（不传则由 current 推导） */
  status?: StepStatus;
  /** 步骤标题 */
  title: string;
}

const props = withDefaults(
  defineProps<{
    /** 自定义类名 */
    class?: any;
    /** 当前激活步骤索引 */
    current?: number;
    /** 标签位置：vertical 垂直显示在右侧 / horizontal 显示在下方 */
    labelPlacement?: 'horizontal' | 'vertical';
    /** 步骤定义列表 */
    steps: StepItem[];
    /** 点状步骤样式 */
    dot?: boolean;
  }>(),
  {
    current: 0,
    dot: false,
    labelPlacement: 'horizontal',
  },
);

const emit = defineEmits<{
  change: [index: number];
}>();

/** 推导出每步状态 */
const resolvedSteps = computed(() =>
  props.steps.map((step, index) => {
    let status = step.status;
    if (!status) {
      if (index < props.current) status = 'finish';
      else if (index === props.current) status = 'process';
      else status = 'wait';
    }
    return { ...step, index, status: status as StepStatus };
  }),
);

function handleStepClick(index: number, disabled?: boolean): void {
  if (disabled) return;
  emit('change', index);
}
</script>

<template>
  <nav :class="cn('flex', props.labelPlacement === 'vertical' ? 'flex-row gap-4' : 'flex-col gap-2', props.class)">
    <ol class="flex w-full items-start">
      <YdStepItem
        v-for="step in resolvedSteps"
        :key="step.index"
        :class="cn('flex-1', step.index === resolvedSteps.length - 1 ? 'flex-none flex-shrink-0' : '')"
        :dot="props.dot"
        :label-placement="props.labelPlacement"
        :step="step"
        :is-last="step.index === resolvedSteps.length - 1"
        @click="handleStepClick(step.index, step.disabled)"
      />
    </ol>
  </nav>
</template>
