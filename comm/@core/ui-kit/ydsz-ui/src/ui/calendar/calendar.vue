<!--
 * Calendar 日历：月历面板，支持日期点选、范围选择、禁用、月份切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\calendar\calendar.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CalendarEmits, CalendarProps } from './calendar-types';

import { computed, ref } from 'vue';

import { ChevronLeft, ChevronRight } from '@ydsz-core/icons';

defineOptions({ name: 'YdCalendar' });

const props = withDefaults(defineProps<CalendarProps>(), {
  isRange: false,
  multiple: false,
  showToday: true,
});

const emit = defineEmits<CalendarEmits>();

/** 当前展示的月份第一天 */
const currentMonth = ref(new Date());

/** 选中日期 */
const selectedDates = ref<Set<string>>(new Set());

/** 范围起始 */
const rangeStart = ref<Date | null>(null);
const rangeEnd = ref<Date | null>(null);

/** 今日日期字符串 */
const todayStr = computed(() => formatDateKey(new Date()));

/** 星期标题 */
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

/** 日历单元格数据 */
const calendarCells = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();

  // 当月第一天是星期几
  const firstDay = new Date(year, month, 1).getDay();
  // 当月天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 上月在开头补位的天数
  const cells: Array<{ date: Date; isCurrentMonth: boolean; isInRange: boolean }> = [];

  // 上月尾日
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    cells.push({ date: d, isCurrentMonth: false, isInRange: isInRange(d) });
  }

  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, isCurrentMonth: true, isInRange: isInRange(date) });
  }

  // 下月补位
  const remain = 42 - cells.length;
  for (let d = 1; d <= remain; d++) {
    const date = new Date(year, month + 1, d);
    cells.push({ date, isCurrentMonth: false, isInRange: isInRange(date) });
  }

  return cells;
});

/** YYYY-MM-DD */
function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 是否已选中 */
function isSelected(date: Date): boolean {
  return selectedDates.value.has(formatDateKey(date));
}

/** 是否在范围内 */
function isInRange(date: Date): boolean {
  if (!rangeStart.value) return false;
  if (!rangeEnd.value) {
    return formatDateKey(date) === formatDateKey(rangeStart.value);
  }
  const t = date.getTime();
  return t >= rangeStart.value.getTime() && t <= rangeEnd.value.getTime();
}

/** 选择日期 */
function handleSelect(date: Date): void {
  if (props.isDisabled) return;
  if (props.disabledDate?.(date)) return;

  if (props.isRange) {
    if (!rangeStart.value || rangeEnd.value) {
      rangeStart.value = date;
      rangeEnd.value = null;
    } else if (date.getTime() < rangeStart.value.getTime()) {
      rangeEnd.value = rangeStart.value;
      rangeStart.value = date;
    } else {
      rangeEnd.value = date;
      emitRange();
    }
    return;
  }

  const key = formatDateKey(date);
  if (props.multiple) {
    if (selectedDates.value.has(key)) {
      selectedDates.value.delete(key);
    } else {
      selectedDates.value.add(key);
    }
    selectedDates.value = new Set(selectedDates.value);
  } else {
    selectedDates.value = new Set([key]);
  }
  emitValue();
}

/** 发出 */
function emitValue(): void {
  const dates = [...selectedDates.value]
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m - 1, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());
  emit('update:value', props.multiple ? dates : dates[0]);
}

function emitRange(): void {
  if (rangeStart.value && rangeEnd.value) {
    emit('update:value', [rangeStart.value, rangeEnd.value]);
  }
}

/** 切换月份 */
function goToMonth(delta: number): void {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + delta);
  currentMonth.value = d;
  emit('panelChange', d);
}

/** 回到今天 */
function goToToday(): void {
  currentMonth.value = new Date();
  handleSelect(new Date());
}

/** 是否今天 */
function isToday(date: Date): boolean {
  return formatDateKey(date) === todayStr.value;
}

/** 显示年月 */
const yearMonthLabel = computed(() => {
  return `${currentMonth.value.getFullYear()}年${currentMonth.value.getMonth() + 1}月`;
});
</script>

<template>
  <div :class="['yd-calendar', props.class, { 'yd-calendar--disabled': isDisabled }]">
    <!-- 头部 -->
    <div class="yd-calendar__header">
      <button class="yd-calendar__nav" type="button" aria-label="上个月" @click="goToMonth(-1)">
        <ChevronLeft class="yd-calendar__nav-icon" />
      </button>
      <span class="yd-calendar__title">{{ yearMonthLabel }}</span>
      <button class="yd-calendar__nav" type="button" aria-label="下个月" @click="goToMonth(1)">
        <ChevronRight class="yd-calendar__nav-icon" />
      </button>
    </div>

    <!-- 星期标题 -->
    <div class="yd-calendar__weekdays">
      <span v-for="day in weekDays" :key="day" class="yd-calendar__weekday">{{ day }}</span>
    </div>

    <!-- 日历格 -->
    <div class="yd-calendar__body">
      <div
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        :class="[
          'yd-calendar__cell',
          { 'yd-calendar__cell--active': isSelected(cell.date) },
          { 'yd-calendar__cell--disabled': disabledDate?.(cell.date) },
          { 'yd-calendar__cell--other-month': !cell.isCurrentMonth },
          { 'yd-calendar__cell--today': isToday(cell.date) },
          { 'yd-calendar__cell--range': cell.isInRange },
        ]"
        role="gridcell"
        @click="handleSelect(cell.date)"
      >
        <span class="yd-calendar__day">{{ cell.date.getDate() }}</span>
      </div>
    </div>

    <!-- 底部 -->
    <div v-if="showToday" class="yd-calendar__footer">
      <button class="yd-calendar__today" type="button" @click="goToToday">今天</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.yd-calendar {
  display: inline-flex;
  flex-direction: column;
  width: 280px;
  padding: 12px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  user-select: none;
}

.yd-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.yd-calendar__title {
  font-size: 15px;
  font-weight: 500;
}

.yd-calendar__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }
}

.yd-calendar__nav-icon {
  width: 16px;
  height: 16px;
}

.yd-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.yd-calendar__weekday {
  text-align: center;
  font-size: 12px;
  color: var(--ydsz-color-text-secondary, #999);
  padding: 4px 0;
}

.yd-calendar__body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.yd-calendar__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  cursor: pointer;
  font-size: 13px;
  border-radius: 4px;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }

  &--active {
    background: var(--ydsz-color-primary, #1677ff) !important;
    color: #fff;
    font-weight: 500;
  }

  &--disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &--other-month {
    color: var(--ydsz-color-text-tertiary, #ccc);
  }

  &--today {
    color: var(--ydsz-color-primary, #1677ff);
    font-weight: 600;
  }

  &--range {
    background: var(--ydsz-color-primary-light, #e6f4ff);
  }
}

.yd-calendar__footer {
  display: flex;
  justify-content: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ydsz-color-border-light, #f0f0f0);
}

.yd-calendar__today {
  padding: 4px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--ydsz-color-primary, #1677ff);
  border-radius: 4px;

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }
}
</style>
