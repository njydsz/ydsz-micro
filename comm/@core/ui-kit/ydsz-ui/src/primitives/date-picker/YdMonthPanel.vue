<!--
 * MonthPanel —— 月份选择面板。
 *
 * <p>用于 type='month' / 'monthrange'：显示 12 个月按钮，点击选中月份。
 * 支持范围模式：首次点击选起始月，二次点击选结束月。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdMonthPanel.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { useSimpleLocale } from '@ydsz-core/composables';

import { cn } from '@ydsz-core/shared/utils';

import { formatMonth } from './date-utils';

const props = defineProps<{
  /** 当前显示的年份 */
  displayYear: Date;
  /** 单模式选中的月份 (YYYY-MM) */
  selected?: string;
  /** 范围起始 (YYYY-MM) */
  rangeStart?: string;
  /** 范围结束 (YYYY-MM) */
  rangeEnd?: string;
  /** 范围预览（结束点未定时） */
  rangeHover?: string;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'hover', date: Date): void;
  (e: 'clearHover'): void;
}>();

const { currentLocale } = useSimpleLocale();

/** 月份标签 */
const MONTH_LABELS = computed(() =>
  currentLocale.value === 'en-US'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
);

/** 12 个月按钮数据 */
const months = computed(() => {
  const year = props.displayYear.getFullYear();
  return MONTH_LABELS.value.map((label, idx) => {
    const date = new Date(year, idx, 1);
    return {
      date,
      key: formatMonth(date),
      label,
      month: idx + 1,
    };
  });
});

/** 单选是否选中 */
function isSelected(key: string): boolean {
  return props.selected != null && key === props.selected;
}

/** 范围角色 */
function rangeRole(key: string): 'end' | 'in' | 'start' | null {
  const { rangeStart: start, rangeEnd: end, rangeHover: hover } = props;
  if (!start) return null;
  if (key === end && end !== start) return 'end';
  if (key === start && start !== end) return 'start';
  if (!end && key === start) return 'start';
  const upper = end ?? hover;
  if (!upper || upper === start) return null;
  const [lo, hi] = start <= upper ? [start, upper] : [upper, start];
  return key > lo && key < hi ? 'in' : null;
}

function handleClick(date: Date): void {
  emit('select', date);
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2 p-1" @mouseleave="emit('clearHover')">
    <button
      v-for="item in months"
      :key="item.key"
      type="button"
      :class="
        cn(
          'relative h-10 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected(item.key) && 'bg-primary text-primary-foreground',
          rangeRole(item.key) === 'in' && 'bg-primary/20 text-foreground',
          rangeRole(item.key) === 'start' && 'bg-primary text-primary-foreground rounded-r-none',
          rangeRole(item.key) === 'end' && 'bg-primary text-primary-foreground rounded-l-none',
        )
      "
      @click="handleClick(item.date)"
      @mouseenter="emit('hover', item.date)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
