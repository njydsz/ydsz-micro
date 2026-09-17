<!--
 * 单个步骤节点：展示序号 / 图标 / 连接线 / 标题 / 描述。
 *
 * 四种状态通过 CSS 类名表达：process（高亮）/ finish（勾选）/ wait（置灰）/ error（红）。
 * 竖排模式下内容区域靠右延展。
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

const isDisabled = computed(() => props.step.disabled ?? false);

function handleClick(): void {
  if (isDisabled.value) return;
  emit('click');
}

const statusIconClass = computed(() => {
  switch (props.step.status) {
    case 'finish':
      return 'bg-step-finish-bg text-step-finish-fg border-step-finish-bg';
    case 'error':
      return 'bg-step-error-bg text-step-error-fg border-step-error-bg';
    case 'process':
      return 'bg-step-process-bg text-step-process-fg border-step-process-bg';
    default:
      return 'bg-step-wait-bg text-step-wait-fg border-step-wait-bg';
  }
});

const connectorClass = computed(() => {
  if (props.step.status === 'finish') return 'bg-step-finish-bg';
  return 'bg-step-wait-bg';
});

const contentClass = computed(() => {
  switch (props.step.status) {
    case 'process':
      return 'text-foreground font-semibold';
    case 'error':
      return 'text-destructive-foreground';
    default:
      return 'text-muted-foreground';
  }
});
</script>

<template>
  <li
    :class="cn('group relative flex cursor-pointer gap-2', isDisabled ? 'cursor-not-allowed opacity-60' : '', props.class)"
    role="listitem"
    @click="handleClick"
  >
    <!-- 左侧：图标 + 连接线 -->
    <div class="flex flex-col items-center">
      <!-- 序号 / 状态图标 -->
      <span
        :class="
          cn(
            'flex shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
            dot ? 'size-2.5' : 'size-8',
            statusIconClass,
          )
        "
      >
        <template v-if="dot"></template>
        <template v-else-if="step.status === 'finish'">
          <Check class="size-4" />
        </template>
        <template v-else-if="step.status === 'error'">
          <span class="text-sm">✕</span>
        </template>
        <template v-else-if="step.icon">
          <slot name="icon">
            {{ step.icon }}
          </slot>
        </template>
        <template v-else>
          {{ step.index + 1 }}
        </template>
      </span>
    </div>

    <!-- 右侧：内容区 -->
    <div :class="cn('flex-1 pb-6', labelPlacement === 'vertical' ? 'pt-0' : 'pt-1')">
      <div class="flex items-center gap-2">
        <span
          :class="cn('text-sm transition-colors', contentClass)"
          :title="step.title"
        >
          <slot name="title">{{ step.title }}</slot>
        </span>
      </div>
      <p
        v-if="step.description"
        :class="
          cn(
            'mt-0.5 text-xs',
            step.status === 'error' ? 'text-destructive-foreground' : 'text-muted-foreground',
          )
        "
      >
        <slot name="description">{{ step.description }}</slot>
      </p>
      <p
        v-if="step.status === 'error' && step.errorDescription"
        class="mt-0.5 text-xs text-destructive-foreground"
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
          dot ? 'left-1.25 top-2.5' : '',
        )
      "
      aria-hidden="true"
    ></span>
  </li>
</template>
