<!--
 * 触发器中展示当前选中文本的位置：未选择时回落到 placeholder 插槽内容。
 *
 * 文本内容来自 YdSelectItemText，本组件只负责占位与截断，
 * 因此不要往里塞 computed 出来的 label —— 那样会与 radix 的回填逻辑分叉，
 * 出现「列表里选中 A、触发器显示 B」的不一致。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectValue.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectValueProps } from 'radix-vue';

import { YdSelectValue } from 'radix-vue';

const props = defineProps<SelectValueProps>();
</script>

<template>
  <YdSelectValue v-bind="props">
    <slot></slot>
  </YdSelectValue>
</template>
