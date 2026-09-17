<!--
 * 表格单元格：td 语义，支持对齐与文本截断。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\TableCell.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'TableCell' });

interface Props {
  /** 对齐方式，默认 'left' */
  align?: 'left' | 'center' | 'right';
  /** 文本截断（单行），默认 false */
  truncate?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  truncate: false,
});

const alignClass = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
} as const;
</script>

<template>
  <td
    :class="
      cn(
        'px-2 py-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        alignClass[props.align],
        truncate && 'truncate max-w-[200px]',
        $props.class ?? '',
      )
    "
  >
    <slot />
  </td>
</template>
