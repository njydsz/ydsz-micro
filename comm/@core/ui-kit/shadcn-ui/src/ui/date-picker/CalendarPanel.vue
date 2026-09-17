<!--
 * CalendarPanel —— 日历网格面板。
 *
 * 渲染指定月份的日历网格，高亮选中日期，支持点击选择。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\date-picker\CalendarPanel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = defineProps<{
  /** 当前显示的月份（以该月 1 号为锚点） */
  displayMonth: Date;
  /** 选中的日期字符串 (YYYY-MM-DD) */
  selected?: string;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
}>();

/** 表头：周日~周六 */
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 当月天数 */
const daysInMonth = computed(() => {
  const year = props.displayMonth.getFullYear();
  const month = props.displayMonth.getMonth();
  return new Date(year, month + 1, 0).getDate();
});

/** 当月 1 号的星期索引 (0=周日) */
const firstDayWeekIndex = computed(() => {
  const year = props.displayMonth.getFullYear();
  const month = props.displayMonth.getMonth();
  return new Date(year, month, 1).getDay();
});

/** 日历网格 (6 行 x 7 列，含前置空白) */
const calendarCells = computed<{ day: number; date: Date; isCurrentMonth: boolean }[]>(() => {
  const year = props.displayMonth.getFullYear();
  const month = props.displayMonth.getMonth();
  const total = 42; // 6 行 x 7 列
  const cells: { day: number; date: Date; isCurrentMonth: boolean }[] = [];

  // 前置：上月的最后几天
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let rowWeekIndex = 0; rowWeekIndex < firstDayWeekIndex.value; rowWeekIndex++) {
    const day = prevMonthDays - firstDayWeekIndex.value + rowWeekIndex + 1;
    cells.push({
      day,
      date: new Date(year, month - 1, day),
      isCurrentMonth: false,
    });
  }

  // 当月
  for (let day = 1; day <= daysInMonth.value; day++) {
    cells.push({
      day,
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // 后置：下月的前几天
  const remaining = total - cells.length;
  for (let day = 1; day <= remaining; day++) {
    cells.push({
      day,
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  return cells;
});

/** 判断某一天是否被选中 */
function isSelected(date: Date): boolean {
  if (!props.selected) {
    return false;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` === props.selected;
}

/** 判断是否为今天 */
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

/**
 * 点击日期。
 *
 * @param date —— 被选中的日期
 */
function handleClick(date: Date): void {
  emit('select', date);
}
</script>

<template>
  <div class="calendar-panel">
    <!-- 星期标题行 -->
    <div class="mb-1 grid grid-cols-7 gap-0">
      <div
        v-for="weekDay in WEEK_DAYS"
        :key="weekDay"
        class="text-muted-foreground flex h-8 items-center justify-center text-xs font-medium"
      >
        {{ weekDay }}
      </div>
    </div>

    <!-- 日期网格 -->
    <div class="grid grid-cols-7 gap-0">
      <button
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        :class="
          cn(
            'hover:bg-accent hover:text-accent-foreground relative flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
            cell.isCurrentMonth
              ? 'text-foreground'
              : 'text-muted-foreground/50',
            isToday(cell.date) && !isSelected(cell.date) && 'font-bold text-primary ring-1 ring-inset ring-primary',
            isSelected(cell.date) && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )
        "
        type="button"
        @click="handleClick(cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>
  </div>
</template>
