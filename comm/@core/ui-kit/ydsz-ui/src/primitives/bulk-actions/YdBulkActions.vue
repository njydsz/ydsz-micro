<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  /** 选中数量 */
  count?: number;
  /** 是否全选 */
  checked?: boolean;
  /** 是否部分选中 */
  indeterminate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  count: 0,
  indeterminate: false,
});

const emit = defineEmits<{
  check: [checked: boolean];
  cancel: [];
}>();
</script>

<template>
  <div
    :class="
      cn(
        'bg-primary/5 flex items-center gap-3 rounded-md border border-primary/20 px-3 py-2 text-sm',
        props.class,
      )
    "
    role="status"
    aria-live="polite"
  >
    <label class="flex items-center gap-1.5">
      <input
        :aria-label="`全选 ${props.count} 项`"
        :checked="props.checked"
        :indeterminate="props.indeterminate"
        class="size-4 rounded border-primary text-primary focus:ring-primary"
        type="checkbox"
        @change="emit('check', ($event.target as HTMLInputElement).checked)"
      />
      <span class="font-medium">
        已选 <span class="text-primary">{{ props.count }}</span> 项
      </span>
    </label>
    <span class="text-muted-foreground">|</span>
    <slot>
      <button class="text-muted-foreground hover:text-foreground transition-colors" type="button" @click="emit('cancel')">
        取消选择
      </button>
    </slot>
  </div>
</template>
