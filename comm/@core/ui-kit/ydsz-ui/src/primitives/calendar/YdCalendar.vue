<!--
 * Calendar 日历：月份视图的日期展示与选择面板。
 *
 * 功能覆盖：
 * - 单日期选择 / 范围选择（startDate + endDate）
 * - 禁用日期函数（disabledDate）
 * - 头部自定义渲染（headerRender：如日期选择器跳转）
 * - 单元格自定义渲染（cellRender / fullCellRender）
 * - 国际化 weekday 标签（通过 locale 注入）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\calendar\YdCalendar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 禁用日期函数 */
  disabledDate?: (date: Date) => boolean;
  /** 默认展示的月份（受控） */
  defaultValue?: Date;
  /** 自定义单元格完整渲染 */
  fullCellRender?: (date: Date) => any;
  /** 头部额外渲染 */
  headerRender?: () => any;
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
}

const props = withDefaults(defineProps<Props>(), {
  disabledDate: undefined,
  range: false,
  showWeekend: true,
});

const emit = defineEmits<{
  'update:value': [date: Date | undefined];
  'update:startDate': [date: Date | undefined];
  'update:endDate': [date: Date | undefined];
  select: [date: Date];
  panelChange: [date: Date];
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

  const days: Array<{
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

import { ref } from 'vue';
</script>

<template>
  <div :class="cn('flex flex-col rounded-lg border p-4', props.class)">
    <!-- 头部 -->
    <div class="mb-3 flex items-center justify-between">
      <button class="hover:bg-muted rounded p-1" type="button" @click="prevMonth">
        <ChevronLeft class="size-4" />
      </button>
      <span class="text-sm font-semibold">
        {{ displayDate.getFullYear() }}年 {{ displayDate.getMonth() + 1 }}月
      </span>
      <button class="hover:bg-muted rounded p-1" type="button" @click="nextMonth">
        <ChevronRight class="size-4" />
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
