<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  color?: string;
  count?: number;
  dot?: boolean;
  /** 是否仅在有值时显示 */
  showZero?: boolean;
  overflowCount?: number;
  status?: 'default' | 'error' | 'processing' | 'success' | 'warning';
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  dot: false,
  overflowCount: 99,
  showZero: false,
  status: 'default',
  text: '',
});

const displayCount = computed(() => {
  if (props.overflowCount !== undefined && (props.count ?? 0) > props.overflowCount) {
    return `${props.overflowCount}+`;
  }
  return String(props.count ?? 0);
});

const isVisible = computed(() => {
  if (props.dot) return (props.count ?? 0) > 0;
  return props.showZero || (props.count ?? 0) > 0;
});

const statusClass = computed(() => {
  const map: Record<string, string> = {
    error: 'bg-red-500',
    processing: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    default: 'bg-neutral-400',
  };
  return map[props.status] ?? map.default;
});
</script>

<template>
  <span v-if="isVisible" :class="cn('relative inline-flex items-center', props.class)">
    <slot></slot>
    <span
      v-if="props.dot"
      :class="cn('absolute -right-1 -top-1 size-2 rounded-full', statusClass, props.color || '')"
      :style="props.color ? { backgroundColor: props.color } : undefined"
      aria-hidden="true"
    ></span>
    <span
      v-else
      :class="
        cn(
          'ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium text-white',
          statusClass,
          props.color || '',
        )
      "
      :style="props.color ? { backgroundColor: props.color } : undefined"
      aria-label="`${displayCount} 条`"
    >
      {{ displayCount }}
      <span v-if="props.text" class="ml-0.5">{{ props.text }}</span>
    </span>
  </span>
</template>
