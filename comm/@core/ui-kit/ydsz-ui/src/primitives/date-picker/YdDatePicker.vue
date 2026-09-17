<!--
 * YdDatePicker Vue 组件 —— 基于 Popover 的日历命令式选择器。
 *
 * 提供与 ElDatePicker 对齐的核心 API：v-model 双向绑定、placeholder、disabled，
 * type 支持 date / datetime / range。range 模式下 v-model 为 `[开始, 结束]` 元组。
 *
 * 改进（YDIZ-POPUP-001）：
 * - 弹出层使用 Teleport 挂载到 body，避免父级 overflow:hidden 裁切
 * - 添加 click-outside 自动关闭，点击弹出层外部即收起
 * - 动态计算触发器位置，确保弹出层在视口内正确显示
 * - z-index 走 --z-overlay token
 * - range 模式：首次点击定起点、二次点击定终点，两者之间显示区间高亮，
 *   结束点未定时随鼠标悬停实时预览区间范围
 *
 * 样式全部使用 Tailwind 设计系统 Token，暗色模式由 CSS 变量驱动。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdDatePicker.vue
 * @author ydsz-team
 * @since 5.3.0
-->
<script setup lang="ts">
import type { DatePickerType, DatePickerValue } from './types';

import { computed, ref } from 'vue';

import { onClickOutside, useElementBounding, useVModel } from '@vueuse/core';

import { cn } from '@ydsz-core/shared/utils';

import { Calendar as CalendarIcon } from 'lucide-vue-next';

import YdCalendarPanel from './YdCalendarPanel.vue';

const props = withDefaults(
  defineProps<{
    class?: any;
    disabled?: boolean;
    modelValue?: DatePickerValue;
    placeholder?: string;
    type?: DatePickerType;
  }>(),
  {
    disabled: false,
    placeholder: '选择日期',
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

/** range 模式下已确定的起始日期 (YYYY-MM-DD) */
const rangeStart = ref<string | undefined>(undefined);

/** range 模式下已确定的结束日期 (YYYY-MM-DD) */
const rangeEnd = ref<string | undefined>(undefined);

/** range 模式下结束点未确定时的悬停预览日期 (YYYY-MM-DD) */
const rangeHover = ref<string | undefined>(undefined);

/** 触发器的视口边界 —— 用于计算弹出层绝对位置 */
const triggerBounds = useElementBounding(triggerRef);

/**
 * 计算弹出层的绝对定位样式。
 * 附着在触发器正下方（top = 触发器下边缘 + 4px 间距），
 * 左边缘对齐触发器左边缘。
 * 触发器未挂载时返回默认位置，避免 computed 求值异常。
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
 * 排除触发器本身的点击（由 toggle 处理），避免冲突。
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

/** 是否为 range 模式 */
const isRange = computed(() => props.type === 'range');

/** 输入框展示值：单模式直接回显，range 模式拼成 `开始 ~ 结束` */
const displayValue = computed(() => {
  if (!isRange.value) {
    return (modelValue.value as string | undefined) ?? '';
  }
  const tuple = modelValue.value as readonly [string, string] | undefined;
  return tuple ? `${tuple[0]} ~ ${tuple[1]}` : '';
});

/**
 * 把日期规范化为 'YYYY-MM-DD' 键。
 *
 * @param date - 日期对象
 * @returns 规范日期字符串
 */
function toKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算初始显示月份。
 * 优先使用 modelValue 解析（range 取起始），否则回退到当前月份。
 *
 * @param value - 当前 v-model 值
 * @return 锚定该月 1 号的 Date 对象
 */
function resolveInitialMonth(value?: DatePickerValue): Date {
  const seed = Array.isArray(value) ? value[0] : value;
  if (seed) {
    const parsed = new Date(seed);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** 当前显示的月份（锚定该月 1 号） */
const displayMonth = ref<Date>(resolveInitialMonth(props.modelValue));

/** 月份标题 */
const monthLabel = computed(() => {
  const year = displayMonth.value.getFullYear();
  const month = displayMonth.value.getMonth() + 1;
  return `${year} 年 ${month} 月`;
});

/** 上一个月 */
function prevMonth(): void {
  const current = displayMonth.value;
  displayMonth.value = new Date(current.getFullYear(), current.getMonth() - 1, 1);
}

/** 下一个月 */
function nextMonth(): void {
  const current = displayMonth.value;
  displayMonth.value = new Date(current.getFullYear(), current.getMonth() + 1, 1);
}

/**
 * 设置 range 模式的当前选择并提交。
 *
 * @remarks
 * 处于 range 模式时遵循「三点一套」的状态机：
 * - 无起点：本次点击作为起点；
 * - 已有起点无终点：本次点击作为终点，按序归一化后提交 `[start, end]` 并收起；
 * - 起点终点俱全：视为开始新一轮选择，本次点击作为新起点。
 * 需要提交两次完整范围后区间内高亮需起点终点同时给定，故实现中起点固定、终点选定即提交。
 *
 * @param start - 起始日期键
 * @param end - 结束日期键
 */
function commitRange(start: string, end: string): void {
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  const value: [string, string] = [lo, hi];
  rangeStart.value = lo;
  rangeEnd.value = hi;
  emits('update:modelValue', value);
  emits('change', value);
  isOpen.value = false;
}

/**
 * 选择日期的统一入口。
 *
 * @param date —— 选中的日期对象
 */
function handleSelect(date: Date): void {
  const key = toKey(date);
  if (!isRange.value) {
    const value = key;
    emits('update:modelValue', value);
    emits('change', value);
    isOpen.value = false;
    return;
  }

  if (!rangeStart.value) {
    rangeStart.value = key;
    rangeEnd.value = undefined;
    rangeHover.value = undefined;
    return;
  }
  if (!rangeEnd.value) {
    commitRange(rangeStart.value, key);
    return;
  }
  // 已有一组范围：开启新一轮
  rangeStart.value = key;
  rangeEnd.value = undefined;
  rangeHover.value = undefined;
}

/**
 * 范围悬停预览：结束点未定时随鼠标更新预览日期，让用户先看到区间。
 *
 * @param date —— 悬停的日期对象
 */
function handleHover(date: Date): void {
  if (isRange.value && rangeStart.value && !rangeEnd.value) {
    rangeHover.value = toKey(date);
  }
}

/** 清除悬停预览日期 */
function handleClearHover(): void {
  rangeHover.value = undefined;
}

/** 切换弹出层显隐 */
function toggle(): void {
  if (props.disabled) {
    return;
  }
  isOpen.value = !isOpen.value;
  // 重新打开时，若 modelValue 已有范围则同步到面板高亮
  if (isOpen.value && isRange.value) {
    const tuple = modelValue.value as readonly [string, string] | undefined;
    if (tuple) {
      rangeStart.value = tuple[0];
      rangeEnd.value = tuple[1];
    }
  }
}
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <!-- 触发器区域 -->
    <div ref="triggerRef" class="relative">
      <input
        :value="displayValue"
        :class="
          cn(
            'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-[220px] rounded-md border bg-input-background px-3 pr-10 text-sm transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'hover:border-border-strong',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )
        "
        :disabled="disabled"
        :placeholder="isRange ? '开始日期 ~ 结束日期' : placeholder"
        readonly
        type="text"
        @click="toggle"
      />
      <button
        :aria-label="'打开日历'"
        :disabled="disabled"
        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
        type="button"
        @click="toggle"
      >
        <CalendarIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- 弹出层 —— Teleport 到 body 避免父级 overflow 裁切 -->
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
          class="border-border bg-popover text-popover-foreground w-[280px] rounded-md border p-3 shadow-md"
        >
          <!-- 月份导航 -->
          <div class="mb-2 flex items-center justify-between">
            <button
              aria-label="上一个月"
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
              aria-label="下一个月"
              class="hover:bg-accent hover:text-accent-foreground rounded-md p-1"
              type="button"
              @click="nextMonth"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- 日历网格 -->
          <YdCalendarPanel
            :display-month="displayMonth"
            :selected="isRange ? undefined : (modelValue as string | undefined)"
            :range-end="rangeEnd"
            :range-hover="rangeHover"
            :range-start="rangeStart"
            @clear-hover="handleClearHover"
            @hover="handleHover"
            @select="handleSelect"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>