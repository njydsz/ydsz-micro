<!--
 * YdRangePicker 日期范围复合选择器。
 *
 * 功能覆盖：
 * - 左侧 + 右侧日历并排显示（可独立翻月）
 * - 范围选择：首次点击定起点、二次点击定终点
 * - 范围 hover 态高亮中间日期（range-hover 类）
 * - 确认 / 取消按钮
 * - 预设快捷选项渲染（继承 useCalendarShortcuts）
 * - showTime 模式内嵌 YdTimePicker（时分秒选择）
 * - 日期格式化显示
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\range-picker\YdRangePicker.vue
 * @author ydsz-team
 * @since 26.09.24
-->
<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next';

import type { CalendarShortcut } from '../calendar/use-calendar-shortcuts';
import YdTimePicker from '../time-picker/YdTimePicker.vue';

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 禁用日期函数 */
  disabledDate?: (date: Date) => boolean;
  /** 日期格式化模板 */
  format?: string;
  /** v-model 绑定值 */
  modelValue?: readonly [Date, Date] | null;
  /** 占位符 [起始, 结束] */
  placeholder?: readonly [string, string];
  /** 快捷选项列表 */
  shortcuts?: readonly CalendarShortcut[];
  /** 是否启用时间选择（内嵌 TimePicker） */
  showTime?: boolean;
  /** 分隔符 */
  separator?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  disabledDate: undefined,
  format: 'YYYY-MM-DD',
  modelValue: null,
  placeholder: () => ['开始日期', '结束日期'] as const,
  shortcuts: () => [],
  showTime: false,
  separator: ' ~ ',
});

const emit = defineEmits<{
  'update:modelValue': [value: readonly [Date, Date] | null];
  change: [value: readonly [Date, Date] | null];
  cancel: [];
}>();

/** 左侧日历显示的月份（1号锚点） */
const leftDisplayDate = ref<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
/** 右侧日历显示的月份（1号锚点） */
const rightDisplayDate = ref<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));

/** 范围起始值 */
const rangeStart = ref<Date | undefined>(props.modelValue?.[0]);
/** 范围结束值 */
const rangeEnd = ref<Date | undefined>(props.modelValue?.[1]);
/** 悬停预览值 */
const rangeHover = ref<Date | undefined>(undefined);

/** 时间选择值 */
const startTime = ref<string | undefined>(undefined);
const endTime = ref<string | undefined>(undefined);

const isOpen = ref<boolean>(false);

/** 格式化日期显示 */
function formatDate(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return props.format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

/** 展示值 */
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  return `${formatDate(props.modelValue[0])}${props.separator}${formatDate(props.modelValue[1])}`;
});

/* ----- 左侧日历导航 ----- */
function leftPrevMonth(): void {
  const d = new Date(leftDisplayDate.value);
  d.setMonth(d.getMonth() - 1);
  leftDisplayDate.value = d;
}

function leftNextMonth(): void {
  const d = new Date(leftDisplayDate.value);
  d.setMonth(d.getMonth() + 1);
  // 确保右侧始终晚于左侧
  if (d.getMonth() >= rightDisplayDate.value.getMonth() && d.getFullYear() >= rightDisplayDate.value.getFullYear()) {
    rightDisplayDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  leftDisplayDate.value = d;
}

/* ----- 右侧日历导航 ----- */
function rightPrevMonth(): void {
  const d = new Date(rightDisplayDate.value);
  d.setMonth(d.getMonth() - 1);
  // 确保右侧始终晚于左侧
  if (d.getMonth() <= leftDisplayDate.value.getMonth() && d.getFullYear() <= leftDisplayDate.value.getFullYear()) {
    leftDisplayDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }
  rightDisplayDate.value = d;
}

function rightNextMonth(): void {
  const d = new Date(rightDisplayDate.value);
  d.setMonth(d.getMonth() + 1);
  rightDisplayDate.value = d;
}

/* ----- 日历网格生成 ----- */
interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  disabled: boolean;
}

function buildCalendarDays(displayDate: Date): CalendarCell[] {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    cells.push({ date, disabled: props.disabledDate?.(date) ?? false, isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    cells.push({ date, disabled: props.disabledDate?.(date) ?? false, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    cells.push({ date, disabled: props.disabledDate?.(date) ?? false, isCurrentMonth: false });
  }
  return cells;
}

const leftCalendarDays = computed(() => buildCalendarDays(leftDisplayDate.value));
const rightCalendarDays = computed(() => buildCalendarDays(rightDisplayDate.value));

function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date): boolean {
  const start = rangeStart.value;
  const end = rangeEnd.value ?? rangeHover.value;
  if (!start || !end) return false;
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  return date >= lo && date <= hi;
}

function isRangeEdge(date: Date): boolean {
  return isSameDay(date, rangeStart.value) || isSameDay(date, rangeEnd.value);
}

function handleDayClick(date: Date): void {
  if (props.disabledDate?.(date)) return;
  if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
    // 开启新选择
    rangeStart.value = date;
    rangeEnd.value = undefined;
    rangeHover.value = undefined;
  } else if (date < rangeStart.value) {
    rangeStart.value = date;
  } else {
    rangeEnd.value = date;
    rangeHover.value = undefined;
  }
}

function handleDayHover(date: Date): void {
  if (rangeStart.value && !rangeEnd.value) {
    rangeHover.value = date;
  }
}

function clearHover(): void {
  rangeHover.value = undefined;
}

function toggle(): void {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

/** 确认选择 */
function confirm(): void {
  if (rangeStart.value && rangeEnd.value) {
    const lo = rangeStart.value <= rangeEnd.value ? rangeStart.value : rangeEnd.value;
    const hi = rangeStart.value <= rangeEnd.value ? rangeEnd.value : rangeStart.value;
    // 附加时间
    let finalLo = lo;
    let finalHi = hi;
    if (props.showTime && startTime.value) {
      const parts = startTime.value.split(':').map(Number);
      finalLo = new Date(lo);
      finalLo.setHours(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0);
    }
    if (props.showTime && endTime.value) {
      const parts = endTime.value.split(':').map(Number);
      finalHi = new Date(hi);
      finalHi.setHours(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0);
    }
    const value: readonly [Date, Date] = [finalLo, finalHi] as const;
    emit('update:modelValue', value);
    emit('change', value);
  }
  isOpen.value = false;
}

/** 取消选择 */
function cancel(): void {
  isOpen.value = false;
  emit('cancel');
}

/** 应用快捷选项 */
function applyShortcut(shortcut: CalendarShortcut): void {
  const val = shortcut.value();
  if (Array.isArray(val) && val.length >= 2) {
    const lo = val[0] as Date;
    const hi = val[1] as Date;
    rangeStart.value = lo;
    rangeEnd.value = hi;
    const value: readonly [Date, Date] = [lo, hi] as const;
    emit('update:modelValue', value);
    emit('change', value);
  }
  isOpen.value = false;
}

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];

const disabled = computed(() => false);
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <!-- 触发器 -->
    <button
      :aria-expanded="isOpen"
      aria-label="日期范围选择器"
      :class="
        cn(
          'border-input bg-input-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          'hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50',
        )
      "
      :disabled="disabled"
      type="button"
      @click="toggle"
    >
      <CalendarIcon class="text-muted-foreground size-4" />
      <span :class="cn(!displayValue && 'text-muted-foreground')">
        {{ displayValue || `${props.placeholder?.[0]}${props.separator}${props.placeholder?.[1]}` }}
      </span>
    </button>

    <!-- 面板 -->
    <div
      v-if="isOpen"
      class="bg-popover text-popover-foreground absolute left-0 top-full z-50 mt-1 rounded-lg border p-3 shadow-lg"
      @keydown.escape="cancel"
    >
      <!-- 快捷选项 -->
      <div v-if="props.shortcuts.length > 0" class="mb-2 flex flex-wrap gap-1 border-b pb-2">
        <button
          v-for="sc in props.shortcuts"
          :key="sc.label"
          type="button"
          class="hover:bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs transition-colors"
          @click="applyShortcut(sc)"
        >
          {{ sc.label }}
        </button>
      </div>

      <!-- 双日历 -->
      <div class="flex gap-4">
        <!-- 左侧日历 -->
        <div class="flex flex-col">
          <!-- 月份导航 -->
          <div class="mb-2 flex items-center justify-between">
            <button class="hover:bg-muted rounded p-1" type="button" aria-label="上一月" @click="leftPrevMonth">
              <ChevronLeft class="size-4" />
            </button>
            <span class="text-xs font-semibold">
              {{ leftDisplayDate.getFullYear() }}年 {{ leftDisplayDate.getMonth() + 1 }}月
            </span>
            <button class="hover:bg-muted rounded p-1" type="button" aria-label="下一月" @click="leftNextMonth">
              <ChevronRight class="size-4" />
            </button>
          </div>

          <!-- 星期 -->
          <div class="grid grid-cols-7 gap-0.5">
            <div
              v-for="(label, i) in weekLabels"
              :key="i"
              class="text-muted-foreground py-0.5 text-center text-[10px] font-medium"
            >
              {{ label }}
            </div>
          </div>

          <!-- 日期网格 -->
          <div class="grid grid-cols-7 gap-0.5" @mouseleave="clearHover">
            <button
              v-for="(day, i) in leftCalendarDays"
              :key="i"
              :aria-label="day.date.toLocaleDateString()"
              :class="
                cn(
                  'relative flex size-7 items-center justify-center rounded text-xs transition-colors',
                  !day.isCurrentMonth && 'opacity-30',
                  day.disabled && 'cursor-not-allowed opacity-20 hover:bg-transparent',
                  !day.disabled && !isRangeEdge(day.date) && !isInRange(day.date) && 'hover:bg-muted',
                  isRangeEdge(day.date) && 'bg-primary text-primary-foreground font-semibold',
                  isInRange(day.date) && !isRangeEdge(day.date) && 'bg-primary/20 range-hover',
                )
              "
              :disabled="day.disabled"
              type="button"
              @click="handleDayClick(day.date)"
              @mouseenter="handleDayHover(day.date)"
            >
              {{ day.date.getDate() }}
            </button>
          </div>
        </div>

        <!-- 右侧日历 -->
        <div class="flex flex-col">
          <!-- 月份导航 -->
          <div class="mb-2 flex items-center justify-between">
            <button class="hover:bg-muted rounded p-1" type="button" aria-label="上一月" @click="rightPrevMonth">
              <ChevronLeft class="size-4" />
            </button>
            <span class="text-xs font-semibold">
              {{ rightDisplayDate.getFullYear() }}年 {{ rightDisplayDate.getMonth() + 1 }}月
            </span>
            <button class="hover:bg-muted rounded p-1" type="button" aria-label="下一月" @click="rightNextMonth">
              <ChevronRight class="size-4" />
            </button>
          </div>

          <!-- 星期 -->
          <div class="grid grid-cols-7 gap-0.5">
            <div
              v-for="(label, i) in weekLabels"
              :key="i"
              class="text-muted-foreground py-0.5 text-center text-[10px] font-medium"
            >
              {{ label }}
            </div>
          </div>

          <!-- 日期网格 -->
          <div class="grid grid-cols-7 gap-0.5" @mouseleave="clearHover">
            <button
              v-for="(day, i) in rightCalendarDays"
              :key="i"
              :aria-label="day.date.toLocaleDateString()"
              :class="
                cn(
                  'relative flex size-7 items-center justify-center rounded text-xs transition-colors',
                  !day.isCurrentMonth && 'opacity-30',
                  day.disabled && 'cursor-not-allowed opacity-20 hover:bg-transparent',
                  !day.disabled && !isRangeEdge(day.date) && !isInRange(day.date) && 'hover:bg-muted',
                  isRangeEdge(day.date) && 'bg-primary text-primary-foreground font-semibold',
                  isInRange(day.date) && !isRangeEdge(day.date) && 'bg-primary/20 range-hover',
                )
              "
              :disabled="day.disabled"
              type="button"
              @click="handleDayClick(day.date)"
              @mouseenter="handleDayHover(day.date)"
            >
              {{ day.date.getDate() }}
            </button>
          </div>
        </div>
      </div>

      <!-- 时间选择（showTime 模式） -->
      <div v-if="props.showTime" class="mt-3 flex items-center gap-2 border-t pt-2">
        <YdTimePicker v-model="startTime" format="HH:mm:ss" size="small" placeholder="开始时间" />
        <span class="text-muted-foreground text-xs">至</span>
        <YdTimePicker v-model="endTime" format="HH:mm:ss" size="small" placeholder="结束时间" />
      </div>

      <!-- 确认/取消按钮 -->
      <div class="mt-3 flex items-center justify-end gap-2 border-t pt-2">
        <button
          type="button"
          class="hover:bg-muted rounded px-3 py-1 text-xs transition-colors"
          @click="cancel"
        >
          取消
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs font-medium transition-colors"
          @click="confirm"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>
