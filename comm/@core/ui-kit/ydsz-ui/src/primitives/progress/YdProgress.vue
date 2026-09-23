<!--
 * Progress 进度条：展示操作的当前进度。
 *
 * 两种模式：determinate（有明确 percentage）/ indeterminate（循环动画）。
 * indeterminate 模式下组件通过 aria-valuemin / aria-valuemax 表达「未知进度」语义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\progress\YdProgress.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps,
} from '@ydsz-core/ydsz-vue';

interface Props extends Omit<ProgressRootProps, 'modelValue'> {
  /** 自定义类名 */
  class?: any;
  /** 是否显示为不确定进度（循环动画） */
  indeterminate?: boolean;
  /** 进度条高度覆盖 */
  barClass?: string;
  /** 当前进度值（0-100），indeterminate 模式下忽略 */
  percentage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  indeterminate: false,
  percentage: 0,
});

const emit = defineEmits<{
  /** 进度达到 100% 时触发 */
  done: [];
}>();

/** 有效百分比值 */
const safePercentage = computed(() => {
  if (props.indeterminate) return undefined;
  const val = Math.min(100, Math.max(0, props.percentage ?? 0));
  if (val >= 100) {
    emit('done');
  }
  return val;
});
</script>

<template>
  <ProgressRoot
    :as-child="false"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700', props.class)"
    :model-value="safePercentage"
  >
    <ProgressIndicator
      :class="
        cn(
          'h-full w-full flex-1 rounded-full bg-primary transition-all duration-300 ease-in-out',
          props.indeterminate && 'animate-pulse w-1/3',
          props.barClass,
        )
      "
      :style="props.indeterminate ? undefined : { transform: `translateX(-${100 - (safePercentage ?? 0)}%)` }"
    />
  </ProgressRoot>
</template>
