<!--
 * 选项的可见文本：radix 依据本组件的文本内容回填到触发器上。
 *
 * 必须存在，否则触发器里不会出现任何文字 ——
 * 触发器读的是这里的文本，而不是调用方传给 YdSelectItem 的 value。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectItemText.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectItemTextProps } from '@ydsz-core/ydsz-vue';

import { YdSelectItemText } from '@ydsz-core/ydsz-vue';

const props = defineProps<SelectItemTextProps>();
</script>

<template>
  <YdSelectItemText v-bind="props">
    <slot></slot>
  </YdSelectItemText>
</template>
