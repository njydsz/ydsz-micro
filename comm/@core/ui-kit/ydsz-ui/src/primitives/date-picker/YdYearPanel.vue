<!--
 * YearPanel —— 年份选择面板。
 *
 * <p>用于 type='year' / 'yearrange'：显示十年区间，左/右箭头翻十年。
 * 单选：点击年份选中；范围：首末点击选中十年区间。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdYearPanel.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { formatYear } from './date-utils';

const props = defineProps<{
  /** 当前十年的锚定起点（即 decadeStart 为整十年份） */
  decadeStart: number;
  /** 单模式选中 YYYY */
  selected?: string;
  /** 起始 YYYY */
  rangeStart?: string;
  /** 结束 YYYY */
  rangeEnd?: string;
  /** 范围预览 */
  rangeHover?: string;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'hover', date: Date): void;
  (e: 'clearHover'): void;
  (e: 'prev-decade'): void;
  (e: 'next-decade'): void;
}>();

/** 十年中的每一年 */
const years = computed(() => {
  const list: { date: Date; key: string; label: string }[] = [];
  for (let offset = 0; offset < 10; offset++) {
    const year = props.decadeStart + offset;
    const date = new Date(year, 0, 1);
    list.push({
      date,
      key: String(year),
      label: String(year),
    });
  }
  return list;
});

function isSelected(key: string): boolean {
  return props.selected != null && key === props.selected;
}

function rangeRole(key: string): 'end' | 'in' | 'start' | null {
  const { rangeStart: start, rangeEnd: end, rangeHover: hover } = props;
  if (!start) return null;
  if (key === end && end !== start) return 'end';
  if (key === start && start !== end) return 'start';
  if (!end && key === start) return 'start';
  const upper = end ?? hover;
  if (!upper || upper === start) return null;
  const lo = Math.min(Number(start), Number(upper));
  const hi = Math.max(Number(start), Number(upper));
  const num = Number(key);
  return num > lo && num < hi ? 'in' : null;
}

function handleClick(date: Date): void {
  emit('select', date);
}
</script>

<template>
  <div class="p-2">
    <!-- 十年导航 -->
    <div class="mb-2 flex items-center justify-between">
      <button
        type="button"
        class="hover:bg-accent rounded-md p-1"
        aria-label="上一个十年"
        @click="emit('prev-decade')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="text-sm font-medium">{{ decadeStart }} - {{ decadeStart + 9 }}</span>
      <button
        type="button"
        class="hover:bg-accent rounded-md p-1"
        aria-label="下一个十年"
        @click="emit('next-decade')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- 年份网格 -->
    <div class="grid grid-cols-5 gap-1" @mouseleave="emit('clearHover')">
      <button
        v-for="item in years"
        :key="item.key"
        type="button"
        :class="
          cn(
            'relative h-10 rounded-md text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isSelected(item.key) && 'bg-primary text-primary-foreground',
            rangeRole(item.key) === 'in' && 'bg-primary/20 text-foreground',
            rangeRole(item.key) === 'start' && 'bg-primary text-primary-foreground rounded-r-none',
            rangeRole(item.key) === 'end' && 'bg-primary text-primary-foreground rounded-l-none',
          )
        "
        @click="handleClick(item.date)"
        @mouseenter="emit('hover', item.date)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
