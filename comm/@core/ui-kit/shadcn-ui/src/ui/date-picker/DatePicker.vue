<!--
 * DatePicker Vue 组件 - 基于 Popover 的日历命令式选择器。
 *
 * 提供与 ElDatePicker 对齐的核心 API：
 * - v-model 双向绑定
 * - placeholder 占位
 * - disabled 禁用
 * - type 支持 date / datetime
 *
 * 样式全部使用 Tailwind 设计系统 Token，暗色模式由 CSS 变量驱动。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\date-picker\DatePicker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DatePickerType } from './types';

import { computed, ref } from 'vue';

import { useVModel } from '@vueuse/core';

import { cn } from '@ydsz-core/shared/utils';

import { Calendar as CalendarIcon } from 'lucide-vue-next';

import CalendarPanel from './CalendarPanel.vue';

const props = withDefaults(
  defineProps<{
    class?: any;
    disabled?: boolean;
    modelValue?: string;
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
  (e: 'update:modelValue', value: string | undefined): void;
  (e: 'change', value: string | undefined): void;
}>();

/** 实时同步 v-model */
const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
});

/** 弹出层是否展开 */
const isOpen = ref(false);

/** 当前显示的月份（锚定该月 1 号） */
const displayMonth = ref<Date>(() => {
  if (modelValue.value) {
    const parsed = new Date(modelValue.value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
});

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
 * 选择日期。
 *
 * @param date —— 选中的日期对象
 */
function handleSelect(date: Date): void {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const value = `${year}-${month}-${day}`;
  emits('update:modelValue', value);
  emits('change', value);
  isOpen.value = false;
}
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <div class="relative">
      <input
        :value="modelValue"
        :class="
          cn(
            'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-[220px] rounded-md border bg-input-background px-3 pr-10 text-sm transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'hover:border-border-strong',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )
        "
        :disabled="disabled"
        :placeholder="placeholder"
        readonly
        type="text"
      />
      <button
        :aria-label="'打开日历'"
        :disabled="disabled"
        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
        type="button"
        @click="isOpen = !isOpen"
      >
        <CalendarIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- 日历弹出层 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="border-border bg-popover text-popover-foreground absolute left-0 top-full z-50 mt-1 w-[280px] rounded-md border p-3 shadow-md"
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
        <CalendarPanel
          :display-month="displayMonth"
          :selected="modelValue"
          @select="handleSelect"
        />
      </div>
    </Transition>
  </div>
</template>
