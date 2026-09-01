<!--
 * 浮层触发器：转发 radix PopoverTrigger 的 props，可用 asChild 套到任意元素上。
 *
 * 本组件不带样式，触发区的外观由传入元素决定 ——
 * 触发器可能是按钮、图标、一段文本，统一反而是限制。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\popover\PopoverTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PopoverTriggerProps } from 'radix-vue';

import { PopoverTrigger } from 'radix-vue';

const props = defineProps<PopoverTriggerProps>();
</script>

<template>
  <PopoverTrigger v-bind="props">
    <slot></slot>
  </PopoverTrigger>
</template>
