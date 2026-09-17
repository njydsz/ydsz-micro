<!--
 * CalendarPanel —— 日历网格面板。
 *
 * 渲染指定月份的日历网格，高亮选中日期，支持点击选择。兼顾单日期与范围两种形态：
 * 范围模式通过 rangeStart/rangeEnd/rangeHover 三个 prop 表达「开始点、结束点、悬停预览点」，
 * 面板据此渲染起点/终点实心高亮与区间过渡底色；hover 预览让用户在选择结束点前先看到区间范围。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdCalendarPanel.vue
 * @author ydsz-team
 * @since 5.3.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { useSimpleLocale } from '@ydsz-core/composables';

import { cn } from '@ydsz-core/shared/utils';

const props = defineProps<{
  /** 当前显示的月份（以该月 1 号为锚点） */
  displayMonth: Date;
  /** 单日期模式的选中值 (YYYY-MM-DD) */
  selected?: string;
  /** 范围模式的起始日期 (YYYY-MM-DD) */
  rangeStart?: string;
  /** 范围模式的结束日期 (YYYY-MM-DD) */
  rangeEnd?: string;
  /** 范围模式中、结束点未确定时的悬停预览日期 (YYYY-MM-DD) */
  rangeHover?: string;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'hover', date: Date): void;
  (e: 'clearHover'): void;
}>();

const { currentLocale } = useSimpleLocale();

/** 星期表头：周日~周六，按语言切换（zh 全角单字，en 缩写） */
const WEEK_DAYS = computed(() =>
  currentLocale.value === 'en-US'
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['日', '一', '二', '三', '四', '五', '六'],
);

/** 把日期规范化为 'YYYY-MM-DD' 键，供比较与高亮 */
function toKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

/** 日历网格 (6 行 x 7 列，含前置空白)，为每格预计算 key */
const calendarCells = computed<{ day: number; date: Date; isCurrentMonth: boolean; key: string }[]>(
  () => {
    const year = props.displayMonth.getFullYear();
    const month = props.displayMonth.getMonth();
    const total = 42; // 6 行 x 7 列
    const cells: { day: number; date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // 前置：上月的最后几天
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let rowWeekIndex = 0; rowWeekIndex < firstDayWeekIndex.value; rowWeekIndex++) {
      const day = prevMonthDays - firstDayWeekIndex.value + rowWeekIndex + 1;
      const date = new Date(year, month - 1, day);
      cells.push({ day, date, isCurrentMonth: false, key: toKey(date) });
    }

    // 当月
    for (let day = 1; day <= daysInMonth.value; day++) {
      const date = new Date(year, month, day);
      cells.push({ day, date, isCurrentMonth: true, key: toKey(date) });
    }

    // 后置：下月的前几天
    const remaining = total - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      cells.push({ day, date, isCurrentMonth: false, key: toKey(date) });
    }

    return cells;
  },
);

/** 判断某一天是否为单日期模式下的选中日 */
function isSelected(key: string): boolean {
  return props.selected != null && key === props.selected;
}

/**
 * 判定某一天在当前范围内所处的角色。
 *
 * @returns 'start' | 'end' | 'in' | null —— 起点/终点/区间内/无
 */
function rangeRole(key: string): 'end' | 'in' | 'start' | null {
  const { rangeStart, rangeEnd, rangeHover } = props;
  if (!rangeStart) {
    return null;
  }
  if (key === rangeEnd && rangeEnd !== rangeStart) {
    return 'end';
  }
  if (key === rangeStart && rangeStart !== rangeEnd) {
    return 'start';
  }
  if (!rangeEnd && key === rangeStart) {
    return 'start';
  }
  // 结束点未定时用悬停预览点兜底区间末端
  const upper = rangeEnd ?? rangeHover;
  if (!upper || upper === rangeStart) {
    return null;
  }
  const [lo, hi] = rangeStart <= upper ? [rangeStart, upper] : [upper, rangeStart];
  return key > lo && key < hi ? 'in' : null;
}

/** 判断是否为今天 */
function isToday(key: string): boolean {
  return key === toKey(new Date());
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
  <div class="calendar-panel" @mousemove.stop @mouseleave="emit('clearHover')">
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
        v-for="cell in calendarCells"
        :key="cell.key"
        :class="
          cn(
            'hover:bg-accent hover:text-accent-foreground relative flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
            cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
            isToday(cell.key) &&
              !isSelected(cell.key) &&
              rangeRole(cell.key) === null &&
              'text-primary ring-primary font-bold ring-1 ring-inset',
            isSelected(cell.key) &&
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            rangeRole(cell.key) === 'in' && 'bg-primary/20 text-foreground rounded-none',
            rangeRole(cell.key) === 'start' &&
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            rangeRole(cell.key) === 'end' &&
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )
        "
        type="button"
        @click="handleClick(cell.date)"
        @mouseenter="emit('hover', cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>
  </div>
</template>
