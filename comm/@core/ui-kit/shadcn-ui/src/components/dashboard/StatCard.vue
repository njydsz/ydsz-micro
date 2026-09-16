<!--
 * 仪表盘指标卡：单数值 + 可选趋势迷你图 + 变化率标签。
 *
 * 设计目标：
 *  - 对标 ForgeLab forge-admin 数据总览页；
 *  - 单数值突出展示（标题 / 值 / 变化率 / 底部迷你图）；
 *  - 变化率颜色语义：正向绿色、负向红色、平稳无色；
 *  - 可选图标槽位 + 迷你趋势线槽位。
 *
 * 使用场景：各子应用首页仪表盘网格中的指标卡。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dashboard\StatCard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { TrendingDown, TrendingUp } from 'lucide-vue-next';

defineOptions({
  name: 'StatCard',
});

interface Props {
  /** 指标值（数字或格式化后的文本） */
  value: string | number;
  /** 指标名称/标题 */
  title: string;
  /** 变化率（百分比数值，如 +12.5 表示 +12.5%） */
  delta?: number;
  /** 变化率标签文案（如"vs 上周"） */
  deltaLabel?: string;
  /** 指标值前缀（如 ¥ / $） */
  prefix?: string;
  /** 指标值后缀（如 "次" / "人"） */
  suffix?: string;
  /** 卡片色调：primary / success / warning / danger / info */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** 自定义类名 */
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  delta: undefined,
  deltaLabel: '',
  prefix: '',
  suffix: '',
  variant: 'primary',
});

/** 格式化数值显示 */
const displayValue = computed<string>(() => {
  const { prefix: pre, value, suffix: suf } = props;
  return `${pre}${value}${suf}`;
});

/** 格式化变化率 */
const displayDelta = computed<string | null>(() => {
  if (props.delta === undefined || props.delta === null || Number.isNaN(props.delta)) {
    return null;
  }
  const sign = props.delta >= 0 ? '+' : '';
  return `${sign}${props.delta.toFixed(1)}%`;
});

/** 变化率颜色语义 */
const deltaColorClass = computed<string>(() => {
  if (props.delta === undefined || props.delta === null) return '';
  if (props.delta > 0) return 'text-green-500';
  if (props.delta < 0) return 'text-red-500';
  return 'text-text-tertiary';
});

/** 变化率图标 */
const TrendIcon = computed<typeof TrendingUp | typeof TrendingDown | null>(() => {
  if (props.delta === undefined || props.delta === null) return null;
  return props.delta >= 0 ? TrendingUp : TrendingDown;
});

/** 顶部图标背景色 */
const variantIconBg: Record<NonNullable<Props['variant']>, string> = {
  danger: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400',
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400',
};
</script>

<template>
  <div
    :class="cn('rounded-xl border border-border-subtle bg-surface-2 p-4 transition-shadow hover:shadow-md', className)"
  >
    <!-- 头部：标题 + 图标 -->
    <div class="mb-3 flex items-start justify-between">
      <h4 class="text-xs font-medium text-text-tertiary">{{ title }}</h4>
      <div
        v-if="$slots.icon"
        :class="cn('flex h-7 w-7 items-center justify-center rounded-lg', variantIconBg[variant])"
      >
        <slot name="icon" />
      </div>
    </div>

    <!-- 数值 -->
    <div class="mb-1 flex items-baseline gap-1">
      <span class="text-2xl font-semibold text-text-primary">{{ displayValue }}</span>
    </div>

    <!-- 变化率 -->
    <div
      v-if="displayDelta"
      class="mb-3 flex items-center gap-1"
    >
      <component
        :is="TrendIcon"
        v-if="TrendIcon"
        :size="14"
        :class="deltaColorClass"
      />
      <span :class="cn('text-xs font-medium', deltaColorClass)">{{ displayDelta }}</span>
      <span
        v-if="deltaLabel"
        class="text-xs text-text-tertiary"
      >
        {{ deltaLabel }}
      </span>
    </div>

    <!-- 底部迷你图槽位 -->
    <div
      v-if="$slots.trend"
      class="mt-2 h-10"
    >
      <slot name="trend" />
    </div>
  </div>
</template>
