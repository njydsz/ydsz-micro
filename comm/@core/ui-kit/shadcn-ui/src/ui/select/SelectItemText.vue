<!--
 * 选项的可见文本：radix 依据本组件的文本内容回填到触发器上。
 *
 * 必须存在，否则触发器里不会出现任何文字 ——
 * 触发器读的是这里的文本，而不是调用方传给 SelectItem 的 value。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\SelectItemText.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectItemTextProps } from 'radix-vue';

import { SelectItemText } from 'radix-vue';

const props = defineProps<SelectItemTextProps>();
</script>

<template>
  <SelectItemText v-bind="props">
    <slot></slot>
  </SelectItemText>
</template>
