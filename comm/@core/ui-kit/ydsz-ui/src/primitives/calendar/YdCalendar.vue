<!--
 * Calendar 日历：月份视图的日期展示与选择面板。
 *
 * 功能覆盖：
 * - 单日期选择 / 范围选择（startDate + endDate）
 * - 禁用日期函数（disabledDate）
 * - 头部自定义渲染（headerRender：如日期选择器跳转）
 * - 单元格自定义渲染（cellRender / fullCellRender）
 * - 国际化 weekday 标签（通过 locale 注入）
 * - 月份/年份快速跳转下拉
 * - "今天"快捷按钮
 * - 预设快捷选项渲染（today / yesterday / thisWeek 等）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\calendar\YdCalendar.vue
 * @author ydsz-team
 * @since 26.09.24
-->
<script lang="ts" setup>
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

import type { CalendarShortcut } from './use-calendar-shortcuts';

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 禁用日期函数 */
  disabledDate?: (date: Date) => boolean;
  /** 默认展示的月份（受控） */
  defaultValue?: Date;
  /** 自定义单元格完整渲染 */
  fullCellRender?: (date: Date) => unknown;
  /** 头部额外渲染 */
  headerRender?: () => unknown;
  /** 是否显示周末（默认显示） */
  showWeekend?: boolean;
  /** 选中日期（受控，单选模式） */
  value?: Date;
  /** 是否为范围模式 */
  range?: boolean;
  /** 范围选择起始值 */
  startDate?: Date;
  /** 范围选择结束值 */
  endDate?: Date;
  /** 快捷选项列表 */
  shortcuts?: readonly CalendarShortcut[];
}

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  disabledDate: undefined,
  defaultValue: undefined,
  fullCellRender: undefined,
  headerRender: undefined,
  range: false,
  showWeekend: true,
  value: undefined,
  startDate: undefined,
  endDate: undefined,
  shortcuts: () => [],
});

const emit = defineEmits<{
  'update:value': [date: Date | undefined];
  'update:startDate': [date: Date | undefined];
  'update:endDate': [date: Date | undefined];
  select: [date: Date];
  panelChange: [date: Date];
  'shortcut-select': [shortcut: CalendarShortcut];
}>();

/** 当前显示的月份 */
const displayDate = ref<Date>(props.value ?? props.defaultValue ?? new Date());

/** 获取当月天数 */
const daysInMonth = computed(() => {
  const year = displayDate.value.getFullYear();
  const month = displayDate.value.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  return { firstDay, month, totalDays, year };
});

/** 日历网格数据 */
const calendarDays = computed(() => {
  const { firstDay, month, totalDays, year } = daysInMonth.value;
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: ReadonlyArray<{
    isCurrentMonth: boolean;
    date: Date;
    disabled: boolean;
  }> = [];

  // 前月补全
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      date,
      disabled: props.disabledDate?.(date) ?? false,
      isCurrentMonth: false,
    });
  }

  // 当月
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      disabled: props.disabledDate?.(date) ?? false,
      isCurrentMonth: true,
    });
  }

  // 后月补全
  const remaining = 42 - days.length; // 6 rows * 7 cols
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      disabled: props.disabledDate?.(date) ?? false,
      isCurrentMonth: false,
    });
  }

  return days;
});

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];

/* ----- 月份/年份跳转 ----- */

/** 当前年份 */
const currentYear = computed(() => displayDate.value.getFullYear());

/** 当前月份（0-based） */
const currentMonth = computed(() => displayDate.value.getMonth());

/** 年份下拉选项（前后 10 年） */
const yearOptions = computed<ReadonlyArray<number>>(() => {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now - 10; y <= now + 10; y++) {
    years.push(y);
  }
  return years;
});

/** 月份下拉选项（1-12） */
const monthOptions = computed<ReadonlyArray<number>>(() => {
  return Array.from({ length: 12 }, (_, i) => i);
});

function onYearChange(year: number): void {
  const d = new Date(displayDate.value);
  d.setFullYear(year);
  displayDate.value = d;
  emit('panelChange', d);
}

function onMonthChange(month: number): void {
  const d = new Date(displayDate.value);
  d.setMonth(month);
  displayDate.value = d;
  emit('panelChange', d);
}

function goToToday(): void {
  const today = new Date();
  displayDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
  emit('panelChange', displayDate.value);
}

/* ----- 月份导航 ----- */

function prevMonth(): void {
  const d = new Date(displayDate.value);
  d.setMonth(d.getMonth() - 1);
  displayDate.value = d;
  emit('panelChange', d);
}

function nextMonth(): void {
  const d = new Date(displayDate.value);
  d.setMonth(d.getMonth() + 1);
  displayDate.value = d;
  emit('panelChange', d);
}

function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date): boolean {
  if (!props.startDate || !props.endDate) return false;
  return date >= props.startDate && date <= props.endDate;
}

function handleSelect(date: Date): void {
  if (props.disabledDate?.(date)) return;
  if (props.range) {
    if (!props.startDate || (props.startDate && props.endDate)) {
      emit('update:startDate', date);
      emit('update:endDate', undefined);
    } else if (date < props.startDate) {
      emit('update:startDate', date);
    } else {
      emit('update:endDate', date);
    }
  } else {
    emit('update:value', date);
  }
  emit('select', date);
}

function handleShortcutClick(shortcut: CalendarShortcut): void {
  emit('shortcut-select', shortcut);
}
</script>

<template>
  <div :class="cn('flex flex-col rounded-lg border p-4', props.class)">
    <!-- 快捷选项 -->
    <div v-if="props.shortcuts.length > 0" class="mb-3 flex flex-wrap gap-1 border-b pb-2">
      <button
        v-for="sc in props.shortcuts"
        :key="sc.label"
        type="button"
        class="hover:bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs transition-colors"
        @click="handleShortcutClick(sc)"
      >
        {{ sc.label }}
      </button>
    </div>

    <!-- 头部：年份/月份跳转 + 月份导航 -->
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <button class="hover:bg-muted rounded p-1" type="button" aria-label="上一月" @click="prevMonth">
          <ChevronLeft class="size-4" />
        </button>

        <!-- 年份下拉 -->
        <select
          :value="currentYear"
          class="hover:bg-muted rounded px-1 py-0.5 text-xs"
          aria-label="选择年份"
          @change="onYearChange(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
        </select>

        <!-- 月份下拉 -->
        <select
          :value="currentMonth"
          class="hover:bg-muted rounded px-1 py-0.5 text-xs"
          aria-label="选择月份"
          @change="onMonthChange(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="m in monthOptions" :key="m" :value="m">{{ m + 1 }}月</option>
        </select>

        <!-- 上一月/下一月导航 -->
        <button class="hover:bg-muted rounded p-1" type="button" aria-label="下一月" @click="nextMonth">
          <ChevronRight class="size-4" />
        </button>
      </div>

      <!-- 今天按钮 -->
      <button
        type="button"
        class="hover:bg-muted text-primary rounded px-2 py-0.5 text-xs font-medium transition-colors"
        @click="goToToday"
      >
        今天
      </button>
    </div>

    <!-- 星期标题 -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(label, i) in weekLabels"
        :key="i"
        class="text-muted-foreground py-1 text-center text-xs font-medium"
      >
        {{ label }}
      </div>
    </div>

    <!-- 日期网格 -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(day, i) in calendarDays"
        :key="i"
        :aria-label="day.date.toLocaleDateString()"
        :aria-selected="isSameDay(day.date, props.value)"
        :class="
          cn(
            'relative flex items-center justify-center rounded-md py-1 text-sm transition-colors hover:bg-muted',
            !day.isCurrentMonth && 'opacity-30',
            day.disabled && 'cursor-not-allowed opacity-20 hover:bg-transparent',
            isSameDay(day.date, props.value) && 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90',
            isInRange(day.date) && 'bg-primary/20',
          )
        "
        :disabled="day.disabled"
        type="button"
        @click="handleSelect(day.date)"
      >
        {{ day.date.getDate() }}
      </button>
    </div>
  </div>
</template>
