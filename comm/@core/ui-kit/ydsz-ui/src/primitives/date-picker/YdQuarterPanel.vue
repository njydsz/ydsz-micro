<!--
 * QuarterPanel —— 季度选择面板。
 *
 * <p>用于 type='quarter'：显示 4 个季度按钮 (Q1~Q4)。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdQuarterPanel.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = defineProps<{
  /** 当前年份 */
  displayYear: Date;
  /** 'YYYY-QN' */
  selected?: string;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
}>();

interface QuarterItem {
  date: Date;
  key: string;
  label: string;
}

const quarters = computed<QuarterItem[]>(() => {
  const year = props.displayYear.getFullYear();
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  return labels.map((label, idx) => {
    const date = new Date(year, idx * 3, 1);
    return {
      date,
      key: `${year}-${label}`,
      label,
    };
  });
});

function isSelected(key: string): boolean {
  return props.selected === key;
}

function handleClick(date: Date): void {
  emit('select', date);
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 p-2">
    <button
      v-for="item in quarters"
      :key="item.key"
      type="button"
      :class="
        cn(
          'relative h-12 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected(item.key) && 'bg-primary text-primary-foreground',
        )
      "
      @click="handleClick(item.date)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
