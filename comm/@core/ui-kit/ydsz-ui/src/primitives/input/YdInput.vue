<!--
 * YdInput Vue 组件 - 现代化输入框样式
 *
 * <p>支持尺寸档位：xs / sm / default / lg，通过 ConfigProvider 统一控制默认尺寸。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\YdInput.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

import { useVModel } from '@vueuse/core';

/** 输入框尺寸档位 */
export type InputSize = 'xs' | 'sm' | 'default' | 'lg';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 默认值 */
  defaultValue?: number | string;
  /** 输入框尺寸 */
  size?: InputSize;
  /** 受控值 */
  modelValue?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: number | string): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
});

/** 尺寸类名映射 */
const sizeClasses: Record<InputSize, string> = {
  default: 'h-10 px-3 py-2 text-sm',
  lg: 'h-11 px-4 py-2.5 text-base',
  sm: 'h-8 px-2.5 py-1.5 text-xs',
  xs: 'h-7 px-2 py-1 text-xs',
};
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-input-background transition-all',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[props.size ?? 'default'],
        props.class,
      )
    "
  />
</template>
