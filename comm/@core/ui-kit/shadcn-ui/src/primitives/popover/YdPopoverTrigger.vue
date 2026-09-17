<!--
 * 浮层触发器：转发 radix YdPopoverTrigger 的 props，可用 asChild 套到任意元素上。
 *
 * 本组件不带样式，触发区的外观由传入元素决定 ——
 * 触发器可能是按钮、图标、一段文本，统一反而是限制。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\popover\YdPopoverTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PopoverTriggerProps } from 'radix-vue';

import { YdPopoverTrigger } from 'radix-vue';

const props = defineProps<PopoverTriggerProps>();
</script>

<template>
  <YdPopoverTrigger v-bind="props">
    <slot></slot>
  </YdPopoverTrigger>
</template>
