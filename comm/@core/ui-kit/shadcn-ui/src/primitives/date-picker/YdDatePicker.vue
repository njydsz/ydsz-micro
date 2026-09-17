<!--
 * YdDatePicker Vue 组件 —— 基于 YdPopoverRoot 的日历命令式选择器。
 *
 * 提供与 ElDatePicker 对齐的核心 API：
 * - v-model 双向绑定
 * - placeholder 占位
 * - disabled 禁用
 * - type 支持 date / datetime
 *
 * 改进（YDIZ-POPUP-001）：
 * - 弹出层使用 Teleport 挂载到 body，避免父级 overflow:hidden 裁切
 * - 添加 click-outside 自动关闭，点击弹出层外部即收起
 * - 动态计算触发器位置，确保弹出层在视口内正确显示
 * - z-index 走 --z-overlay token
 *
 * 样式全部使用 Tailwind 设计系统 Token，暗色模式由 CSS 变量驱动。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\date-picker\YdDatePicker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DatePickerType } from './types';

import { computed, ref } from 'vue';

import { onClickOutside, useElementBounding, useVModel } from '@vueuse/core';

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

/** 触发器引用 —— 用于定位弹出层与 click-outside 排除 */
const triggerRef = ref<HTMLElement | null>(null);

/** 弹出层容器引用 —— 用于 click-outside 侦听 */
const popoverRef = ref<HTMLElement | null>(null);

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

/**
 * 计算初始显示月份。
 * 优先使用 modelValue 解析，否则回退到当前月份。
 *
 * @param modelValueStr - 当前 v-model 值 (YYYY-MM-DD)
 * @return 锚定该月 1 号的 Date 对象
 */
function resolveInitialMonth(modelValueStr?: string): Date {
  if (modelValueStr) {
    const parsed = new Date(modelValueStr);
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

/** 切换弹出层显隐 */
function toggle(): void {
  if (props.disabled) {
    return;
  }
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <!-- 触发器区域 -->
    <div ref="triggerRef" class="relative">
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
          <CalendarPanel
            :display-month="displayMonth"
            :selected="modelValue"
            @select="handleSelect"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
