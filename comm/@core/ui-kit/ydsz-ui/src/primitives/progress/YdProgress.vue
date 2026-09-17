<!--
 * Progress 进度条：展示操作的当前进度。
 *
 * 两种模式：determinate（有明确 percentage）/ indeterminate（循环动画）。
 * indeterminate 模式下组件通过 aria-valuemin / aria-valuemax 表达「未知进度」语义。
 *
 * 进度指示器宽度通过 style.width 内联样式设置，因为百分比值来自 prop，
 * 无法在 Tailwind 安全列表枚举。使用 :style 而非 class 拼接是 shadcn 标准范式。
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
} from 'radix-vue';

interface Props extends ProgressRootProps {
  /** 自定义类名 */
  class?: any;
  /** 是否显示为不确定进度（循环动画） */
  indeterminate?: boolean;
  /** 进度条高度覆盖（tailwind 类，如 h-2） */
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
    :class="
      cn(
        'bg-progress-track relative h-2 w-full overflow-hidden rounded-full',
        props.class,
      )
    "
    :model-value="safePercentage"
  >
    <ProgressIndicator
      :class="
        cn(
          'h-full w-full flex-1 rounded-full transition-all duration-300 ease-in-out',
          props.indeterminate
            ? 'animate-indeterminate bg-primary'
            : 'bg-primary',
          props.barClass,
        )
      "
      :style="
        props.indeterminate ? undefined : { transform: `translateX(-${100 - safePercentage!}%)` }
      "
    />
  </ProgressRoot>
</template>
