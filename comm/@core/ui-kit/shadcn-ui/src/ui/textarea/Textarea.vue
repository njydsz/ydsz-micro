<!--
 * 多行输入框：通过 useVModel 建立双向绑定，默认最小高度 60px。
 *
 * passive: true 让组件不主动把 props.modelValue 同步回父级，
 * 只在用户真正输入时派发 update:modelValue ——
 * 否则配合表单库使用时会出现「父级回写 → 子级再派发」的循环。
 * 高度随内容增长需调用方自行处理，这里只保证最小高度，
 * 因为自动增高在受控受值来回同步时极易产生抖动。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\textarea\Textarea.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

import { useVModel } from '@vueuse/core';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
  defaultValue?: number | string;
  modelValue?: number | string;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: number | string): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  ></textarea>
</template>
