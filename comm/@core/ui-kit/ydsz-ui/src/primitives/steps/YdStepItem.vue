<!--
 * 单个步骤节点：展示序号 / 图标 / 连接线 / 标题 / 描述。
 *
 * 根据 status 自动应用不同样式：
 * - process（高亮蓝色）
 * - finish（绿色勾选）
 * - wait（置灰）
 * - error（红色）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\steps\YdStepItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { StepItem } from './YdSteps.vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Check } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否为末步骤（不渲染连接线） */
  isLast?: boolean;
  /** 标签位置 */
  labelPlacement?: 'horizontal' | 'vertical';
  /** 是否点状样式 */
  dot?: boolean;
  /** 步骤数据 */
  step: StepItem & { index: number; status: string };
}

const props = withDefaults(defineProps<Props>(), {
  dot: false,
  isLast: false,
  labelPlacement: 'horizontal',
});

const emit = defineEmits<{
  click: [];
}>();

function handleClick(): void {
  if (props.step.disabled) return;
  emit('click');
}

const statusIconClass = computed(() => {
  switch (props.step.status) {
    case 'finish':
      return 'bg-green-500 text-white border-green-500';
    case 'error':
      return 'bg-destructive text-destructive-foreground border-destructive';
    case 'process':
      return 'bg-primary text-primary-foreground border-primary';
    default:
      return 'bg-neutral-200 text-neutral-500 border-neutral-300 dark:bg-neutral-700 dark:text-neutral-400';
  }
});

const connectorClass = computed(() => {
  if (props.step.status === 'finish') return 'bg-green-500';
  return 'bg-neutral-200 dark:bg-neutral-700';
});

const contentClass = computed(() => {
  switch (props.step.status) {
    case 'process':
      return 'text-foreground font-semibold';
    case 'error':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
});
</script>

<template>
  <li
    :class="cn('group relative flex cursor-pointer gap-2', props.step.disabled ? 'cursor-not-allowed opacity-60' : '', props.class)"
    role="listitem"
    @click="handleClick"
  >
    <!-- 左侧：图标 + 连接线 -->
    <div class="flex flex-col items-center">
      <span
        :class="
          cn(
            'flex shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
            props.dot ? 'size-2.5' : 'size-8',
            statusIconClass,
          )
        "
      >
        <template v-if="!props.dot">
          <Check v-if="step.status === 'finish'" class="size-4" />
          <template v-else-if="step.status === 'error'">
            <span class="text-sm">✕</span>
          </template>
          <template v-else-if="step.icon">
            <slot name="icon">{{ step.icon }}</slot>
          </template>
          <template v-else>
            {{ step.index + 1 }}
          </template>
        </template>
      </span>
    </div>

    <!-- 右侧：内容区 -->
    <div :class="cn('flex-1 pb-6', props.labelPlacement === 'vertical' ? 'pt-0' : 'pt-1')">
      <div class="flex items-center gap-2">
        <span :class="cn('text-sm transition-colors', contentClass)" :title="step.title">
          <slot name="title">{{ step.title }}</slot>
        </span>
      </div>
      <p
        v-if="step.description"
        :class="cn('mt-0.5 text-xs', step.status === 'error' ? 'text-destructive' : 'text-muted-foreground')"
      >
        <slot name="description">{{ step.description }}</slot>
      </p>
      <p
        v-if="step.status === 'error' && step.errorDescription"
        class="mt-0.5 text-xs text-destructive"
      >
        {{ step.errorDescription }}
      </p>
    </div>

    <!-- 连接线（非末步骤） -->
    <span
      v-if="!isLast"
      :class="
        cn(
          'absolute left-4 top-8 h-full w-px -translate-x-1/2',
          connectorClass,
          props.dot ? 'left-[4.5px] top-[10px]' : '',
        )
      "
      aria-hidden="true"
    ></span>
  </li>
</template>
