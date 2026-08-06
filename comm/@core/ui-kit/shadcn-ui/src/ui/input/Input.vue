<!--
 * Input Vue 组件 - 现代化输入框样式
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\input\Input.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from "@remi-core/shared/utils";

import { useVModel } from "@vueuse/core";

const props = defineProps<{
  class?: any;
  defaultValue?: number | string;
  modelValue?: number | string;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: number | string): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  defaultValue: props.defaultValue,
  passive: true,
});
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-input-background px-3 py-2 text-sm transition-all',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
