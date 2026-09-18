<!--
 * YdStatCard — KPI 单值统计卡片。
 *
 * <p>展示核心指标（金额/数量/率值）及趋势方向，支持自动前后对比。
 *
 * @path comm\@core\ui-kit\dashboard\src\components\YdStatCard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import type { StatCard } from '../types';

const props = defineProps<{
  card: StatCard;
}>();

/** 计算趋势百分比和方向 */
const trend = computed<{
  isUp: boolean;
  isDown: boolean;
  isFlat: boolean;
  text: string;
}>(() => {
  const { compareValue, value } = props.card;
  if (!compareValue || Number(value) === compareValue) {
    return { isUp: false, isDown: false, isFlat: true, text: '持平' };
  }
  const diff = (Number(value) - compareValue) / compareValue * 100;
  return {
    isUp: diff > 0,
    isDown: diff < 0,
    isFlat: false,
    text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
  };
});

/** 格式化后的显示值 */
const formattedValue = computed<string>(() => {
  const { value, precision, prefix, suffix } = props.card;
  let result: string;
  if (typeof value === 'number' && precision !== undefined) {
    result = value.toFixed(precision);
  } else {
    result = String(value);
  }
  const pre = prefix ?? '';
  const suf = suffix ?? '';
  return `${pre}${result}${suf}`;
});

/** 色系对应的背景样式类 */
const colorClass = computed<string>(() => {
  const map: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground',
  };
  return map[props.card.color ?? 'primary'] ?? map.primary;
});
</script>

<template>
  <div class="ds-stat-card flex h-full flex-col justify-between rounded-lg border bg-card p-4 shadow-sm">
    <!-- 标题行 -->
    <div class="flex items-start justify-between">
      <div>
        <h4 class="text-xs font-medium text-muted-foreground">{{ card.title }}</h4>
        <p v-if="card.subtitle" class="mt-0.5 text-[11px] text-muted-foreground">
          {{ card.subtitle }}
        </p>
      </div>
      <span v-if="card.icon" :class="['text-2xl', colorClass]" aria-hidden="true">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </span>
    </div>

    <!-- 数值行 -->
    <div class="mt-3 flex items-end justify-between">
      <span :class="['text-3xl font-semibold', colorClass]">
        {{ formattedValue }}
      </span>
      <span
        v-if="!trend.isFlat"
        :class="[
          'flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          trend.isUp ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive',
        ]"
      >
        <svg v-if="trend.isUp" xmlns="http://www.w3.org/2000/svg" class="mr-0.5 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="mr-0.5 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
        </svg>
        {{ trend.text }}
      </span>
    </div>
  </div>
</template>
