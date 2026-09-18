<!--
 * YdDatePicker Vue 组件 —— 基于 Popover 的日历命令式选择器，全粒度矩阵。
 *
 * 提供对齐业界 DatePicker 的核心 API：v-model 双向绑定、placeholder、disabled，
 * type 支持 date / datetime / week / month / quarter / year 及 range 变体（共 10 种）。
 *
 * 改进（YDIZ-POPUP-001 + 5.6.0）：
 * - 弹出层使用 Teleport 挂载到 body，避免父级 overflow:hidden 裁切
 * - 添加 click-outside 自动关闭，点击弹出层外部即收起
 * - 动态计算触发器位置，确保弹出层在视口内正确显示
 * - z-index 走 --z-overlay token
 * - range 模式：首次点击定起点、二次点击定终点，两者之间显示区间高亮，
 *   结束点未定时随鼠标悬停实时预览区间范围
 * - 5.6.0 新增：week / month / quarter / year 粒度与对应 range 变体，
 *   面板可在日 / 月 / 年视图层级上切换
 *
 * 样式全部使用 Tailwind 设计系统 Token，暗色模式由 CSS 变量驱动。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdDatePicker.vue
 * @author ydsz-team
 * @since 5.3.0 (5.6.0 支持 week/month/quarter/year 全粒度)
-->
<script setup lang="ts">
import type { DatePickerShortcut, DatePickerType, DatePickerValue } from './types';

import { computed, ref } from 'vue';

import { onClickOutside, useElementBounding, useVModel } from '@vueuse/core';

import { useLocale } from '../../locale/useLocale';

import { cn } from '@ydsz-core/shared/utils';

import { Calendar as CalendarIcon } from 'lucide-vue-next';

import YdCalendarPanel from './YdCalendarPanel.vue';
import YdMonthPanel from './YdMonthPanel.vue';
import YdQuarterPanel from './YdQuarterPanel.vue';
import YdYearPanel from './YdYearPanel.vue';
import {
  endOfByGrain,
  formatByGrain,
  isRangeType,
  parseByGrain,
  resolveRangeBase,
  startOfByGrain,
  startOfYear,
} from './date-utils';

const props = withDefaults(
  defineProps<{
    class?: any;
    disabled?: boolean;
    modelValue?: DatePickerValue;
    placeholder?: string;
    type?: DatePickerType;
    shortcuts?: DatePickerShortcut[];
  }>(),
  {
    disabled: false,
    type: 'date',
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', value: DatePickerValue | undefined): void;
  (e: 'change', value: DatePickerValue | undefined): void;
}>();

/** 实时同步 v-model */
const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
});

/** 弹出层是否展开 */
const isOpen = ref(false);

/** 触发器引用 —— 用于定位弹出层与 click-outside 排除 */
const triggerRef = ref<HTMLElement | null>(null);

/** 弹出层容器引用 —— 用于 click-outside 侦听 */
const popoverRef = ref<HTMLElement | null>(null);

/** 触发器的视口边界 —— 用于计算弹出层绝对位置 */
const triggerBounds = useElementBounding(triggerRef);

/** 粒度信息 */
const grain = computed<DatePickerType>(() => props.type ?? 'date');
const isRange = computed(() => isRangeType(grain.value));
const baseGrain = computed(() => resolveRangeBase(grain.value));

/* ----- 月份/年份导航状态 ----- */
const now = new Date();

/** 当前视图的"日"锚点（控制日网格显示哪个月） */
const viewDate = ref<Date>(resolveViewDate(props.modelValue));

/** 十年锚点（type=year） */
const decadeStart = computed(() => Math.floor(viewDate.value.getFullYear() / 10) * 10);

function resolveViewDate(value?: DatePickerValue): Date {
  if (!value) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const seed = Array.isArray(value) ? value[0] : value;
  const parsed = parseByGrain(seed, baseGrain.value);
  if (parsed) {
    return startOfByGrain(parsed, baseGrain.value);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 计算弹出层的绝对定位样式。
 */
const popoverStyle = computed(() => {
  const left = triggerBounds.left.value || 0;
  const top = triggerBounds.bottom.value || 0;
  return {
    left: `${left}px`,
    position: 'fixed' as const,
    top: `${top + 4}px`,
    zIndex: 'var(--z-overlay)',
  };
});

/**
 * 点击弹出层外部时收起面板。
 */
onClickOutside(
  popoverRef,
  () => {
    isOpen.value = false;
  },
  {
    ignore: [triggerRef],
  },
);

const { t } = useLocale();

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 月份标题 */
const monthLabel = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  return `${year} 年 ${month + 1} 月`;
});

/** 十年标题 */
const yearRangeLabel = computed(() => {
  const start = decadeStart.value;
  return `${start} - ${start + 9}`;
});

/** year 视图标题（10年一级） */
function prevDecade(): void {
  viewDate.value = new Date(decadeStart.value - 10, 0, 1);
}

function nextDecade(): void {
  viewDate.value = new Date(decadeStart.value + 10, 0, 1);
}

/** 月份视图导航 */
function prevMonth(): void {
  const current = viewDate.value;
  viewDate.value = new Date(current.getFullYear(), current.getMonth() - 1, 1);
}

function nextMonth(): void {
  const current = viewDate.value;
  viewDate.value = new Date(current.getFullYear(), current.getMonth() + 1, 1);
}

/** 输入框展示值 */
const displayValue = computed(() => {
  if (!isRange.value) {
    const v = modelValue.value as string | undefined;
    return v ?? '';
  }
  const tuple = modelValue.value as readonly [string, string] | undefined;
  return tuple ? `${tuple[0]} ~ ${tuple[1]}` : '';
});

/* ----- 选择状态 ----- */
/** range 起始值 */
const rangeStartValue = ref<string | undefined>(undefined);
/** range 结束值 */
const rangeEndValue = ref<string | undefined>(undefined);
/** range 悬停预览 */
const rangeHoverValue = ref<string | undefined>(undefined);

/** 同步已选范围到本地状态 */
function syncRangeFromModel(): void {
  if (isRange.value) {
    const tuple = modelValue.value as readonly [string, string] | undefined;
    if (tuple) {
      rangeStartValue.value = tuple[0];
      rangeEndValue.value = tuple[1];
    }
  }
}

/** 值格式化（用于 range 提交） */
function normalizeRange(start: string, end: string): [string, string] {
  return start <= end ? [start, end] : [end, start];
}

/**
 * 提交选择值。
 */
function commitSingle(value: string): void {
  emits('update:modelValue', value);
  emits('change', value);
  isOpen.value = false;
}

function commitRange(start: string, end: string): void {
  const [lo, hi] = normalizeRange(start, end);
  const value: [string, string] = [lo, hi];
  rangeStartValue.value = lo;
  rangeEndValue.value = hi;
  rangeHoverValue.value = undefined;
  emits('update:modelValue', value);
  emits('change', value);
  isOpen.value = false;
}

/**
 * 日视图点击处理。
 *
 * @param date —— 选中的日期对象
 */
function handleDaySelect(date: Date): void {
  const key = formatByGrain(date, baseGrain.value);

  if (!isRange.value) {
    commitSingle(key);
    return;
  }

  if (!rangeStartValue.value) {
    rangeStartValue.value = key;
    rangeEndValue.value = undefined;
    rangeHoverValue.value = undefined;
    return;
  }
  if (!rangeEndValue.value) {
    commitRange(rangeStartValue.value, key);
    return;
  }
  // 已有一组范围：开启新一轮
  rangeStartValue.value = key;
  rangeEndValue.value = undefined;
  rangeHoverValue.value = undefined;
}

/**
 * 月份视图点击处理。
 */
function handleMonthSelect(date: Date): void {
  const key = formatByGrain(date, 'month');
  if (!isRange.value) {
    commitSingle(key);
    return;
  }
  if (!rangeStartValue.value) {
    rangeStartValue.value = key;
    rangeEndValue.value = undefined;
    rangeHoverValue.value = undefined;
    return;
  }
  if (!rangeEndValue.value) {
    commitRange(rangeStartValue.value, key);
    return;
  }
  rangeStartValue.value = key;
  rangeEndValue.value = undefined;
  rangeHoverValue.value = undefined;
}

/**
 * 年份视图点击处理。
 */
function handleYearSelect(date: Date): void {
  const key = formatByGrain(date, 'year');
  if (!isRange.value) {
    commitSingle(key);
    return;
  }
  if (!rangeStartValue.value) {
    rangeStartValue.value = key;
    rangeEndValue.value = undefined;
    rangeHoverValue.value = undefined;
    return;
  }
  if (!rangeEndValue.value) {
    commitRange(rangeStartValue.value, key);
    return;
  }
  rangeStartValue.value = key;
  rangeEndValue.value = undefined;
  rangeHoverValue.value = undefined;
}

/**
 * 季度视图点击处理。
 */
function handleQuarterSelect(date: Date): void {
  const key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
  commitSingle(key);
}

/** 范围悬停预览 */
function handleHover(date: Date): void {
  if (isRange.value && rangeStartValue.value && !rangeEndValue.value) {
    rangeHoverValue.value = formatByGrain(date, baseGrain.value);
  }
}

function handleClearHover(): void {
  rangeHoverValue.value = undefined;
}

/** 切换弹出层显隐 */
function toggle(): void {
  if (props.disabled) {
    return;
  }
  isOpen.value = !isOpen.value;
  viewDate.value = resolveViewDate(props.modelValue);
  syncRangeFromModel();
}

/** 应用快捷项 */
function applyShortcut(shortcut: DatePickerShortcut): void {
  const value = shortcut.value();
  if (value != null) {
    emits('update:modelValue', value);
    emits('change', value);
  }
  isOpen.value = false;
}

/** 当前选中（用于 CalendarPanel highlight） */
const daySelected = computed(() => {
  if (isRange.value) return undefined;
  return (modelValue.value as string | undefined) ?? undefined;
});

/* ----- 视图宽度（按粒度） ----- */
const panelWidth = computed(() => {
  switch (baseGrain.value) {
    case 'year':
      return 'w-[240px]';
    case 'quarter':
      return 'w-[200px]';
    case 'month':
      return 'w-[220px]';
    default:
      return 'w-[280px]';
  }
});
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <!-- 触发器区域 -->
    <div ref="triggerRef" class="relative">
      <input
        :value="displayValue"
        :class="
          cn(
            'border-input placeholder:text-muted-foreground focus-visible:ring-ring bg-input-background flex h-10 w-[240px] rounded-md border px-3 pr-10 text-sm transition-all',
            'focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'hover:border-border-strong',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )
        "
        :disabled="disabled"
        :placeholder="placeholder ?? t('selectDate')"
        readonly
        type="text"
        @click="toggle"
      />
      <button
        :aria-label="t('openCalendar')"
        :disabled="disabled"
        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
        type="button"
        @click="toggle"
      >
        <CalendarIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- 弹出层 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-show="isOpen"
          ref="popoverRef"
          :style="popoverStyle"
          :class="cn('border-border bg-popover text-popover-foreground rounded-md border p-3 shadow-md', panelWidth)"
        >
          <!-- 快捷项 -->
          <div v-if="shortcuts && shortcuts.length > 0" class="mb-2 flex flex-wrap gap-1 border-b pb-2">
            <button
              v-for="sc in shortcuts"
              :key="sc.text"
              type="button"
              class="hover:bg-accent text-muted-foreground rounded px-2 py-0.5 text-xs"
              @click="applyShortcut(sc)"
            >
              {{ sc.text }}
            </button>
          </div>

          <!-- 按粒度渲染不同面板 -->
          <template v-if="baseGrain === 'year'">
            <YdYearPanel
              :decade-start="decadeStart"
              :selected="isRange ? undefined : daySelected"
              :range-end="rangeEndValue"
              :range-hover="rangeHoverValue"
              :range-start="rangeStartValue"
              @clear-hover="handleClearHover"
              @hover="handleHover"
              @next-decade="nextDecade"
              @prev-decade="prevDecade"
              @select="handleYearSelect"
            />
          </template>

          <template v-else-if="baseGrain === 'quarter'">
            <YdQuarterPanel :display-year="viewDate" :selected="daySelected" @select="handleQuarterSelect" />
          </template>

          <template v-else-if="baseGrain === 'month'">
            <YdMonthPanel
              :display-year="viewDate"
              :selected="isRange ? undefined : daySelected"
              :range-end="rangeEndValue"
              :range-hover="rangeHoverValue"
              :range-start="rangeStartValue"
              @clear-hover="handleClearHover"
              @hover="handleHover"
              @select="handleMonthSelect"
            />
          </template>

          <template v-else>
            <!-- 日视图（date / datetime / week / range 变体）-->
            <!-- 月份导航 -->
            <div class="mb-2 flex items-center justify-between">
              <button
                :aria-label="t('previousMonth')"
                class="hover:bg-accent hover:text-accent-foreground rounded-md p-1"
                type="button"
                @click="prevMonth"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <span class="text-sm font-medium">{{ monthLabel }}</span>
              <button
                :aria-label="t('nextMonth')"
                class="hover:bg-accent hover:text-accent-foreground rounded-md p-1"
                type="button"
                @click="nextMonth"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <YdCalendarPanel
              :display-month="viewDate"
              :selected="daySelected"
              :range-end="rangeEndValue"
              :range-hover="rangeHoverValue"
              :range-start="rangeStartValue"
              @clear-hover="handleClearHover"
              @hover="handleHover"
              @select="handleDaySelect"
            />
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
