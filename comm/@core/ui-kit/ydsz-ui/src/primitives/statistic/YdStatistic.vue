<!--
 * Statistic 统计数值：突出显示核心指标。
 *
 * 支持前缀/后缀、精度、千分符分隔。
 * 对于 loading 态使用骨架屏占位。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\statistic\YdStatistic.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdSkeleton } from '../skeleton';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 小数精度 */
  precision?: number;
  /** 后缀 */
  suffix?: string;
  /** 标题 */
  title?: string;
  /** 是否使用千分符 */
  thousand?: boolean;
  /** 数值 */
  value?: string | number;
  /** 是否加载中 */
  loading?: boolean;
  /** 前缀 */
  prefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  precision: undefined,
  thousand: true,
});

/** 格式化后的数值 */
const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return '-';
  const num = typeof props.value === 'string' ? Number.parseFloat(props.value) : props.value;
  if (Number.isNaN(num)) return String(props.value);

  let result: string;
  if (props.precision !== undefined) {
    result = num.toFixed(props.precision);
  } else {
    result = String(num);
  }

  if (props.thousand && Number.isFinite(num)) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }
  return result;
});
</script>

<template>
  <div :class="cn('flex flex-col gap-1', props.class)">
    <p v-if="props.title" class="text-muted-foreground text-sm">
      {{ props.title }}
    </p>
    <div class="flex items-baseline gap-1">
      <span v-if="props.prefix" class="text-foreground text-xl font-semibold">{{ props.prefix }}</span>
      <YdSkeleton v-if="props.loading" class="h-8 w-24" :shimmer="true" />
      <span v-else class="text-foreground text-3xl font-bold tabular-nums">
        {{ formattedValue }}
      </span>
      <span v-if="props.suffix" class="text-muted-foreground text-sm">{{ props.suffix }}</span>
    </div>
  </div>
</template>
