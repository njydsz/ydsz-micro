<!--
 * 表头单元格：th 语义，提供对齐与截断。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\TableHead.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'TableHead' });

interface Props {
  /** 对齐方式，默认 'left' */
  align?: 'left' | 'center' | 'right';
  /** 列宽度 */
  width?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { align: 'left' });

const alignClass = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
} as const;
</script>

<template>
  <th
    :class="
      cn(
        'h-10 px-2 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        alignClass[props.align],
        $props.class ?? '',
      )
    "
    :style="width ? { width } : undefined"
    scope="col"
  >
    <slot />
  </th>
</template>
