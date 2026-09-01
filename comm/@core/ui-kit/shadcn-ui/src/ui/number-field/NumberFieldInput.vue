<!--
 * 数字输入框本体：文本居中对齐，因为左右已被增减按钮占据，居左会显得偏向一侧。
 *
 * 打上 data-slot="input" 供 NumberFieldContent 定位内边距；
 * 值的变化与步进逻辑全部由 radix NumberFieldRoot 托管，本组件不自行处理键盘输入。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\NumberFieldInput.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

import { NumberFieldInput } from 'radix-vue';
</script>

<template>
  <NumberFieldInput
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent py-1 text-center text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
      )
    "
    data-slot="input"
  />
</template>
