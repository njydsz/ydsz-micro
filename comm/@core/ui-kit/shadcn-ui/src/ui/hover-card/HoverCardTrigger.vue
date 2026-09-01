<!--
 * 悬停卡片的触发器：转发 radix HoverCardTrigger 的 props，支持 asChild 套到任意元素上。
 *
 * 本组件不接管样式，触发器外观完全由传入的元素决定 ——
 * 因为触发区可能是链接、头像、表格单元格，形态差异过大，统一反而是限制。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\hover-card\HoverCardTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { HoverCardTriggerProps } from 'radix-vue';

import { HoverCardTrigger } from 'radix-vue';

const props = defineProps<HoverCardTriggerProps>();
</script>

<template>
  <HoverCardTrigger v-bind="props">
    <slot></slot>
  </HoverCardTrigger>
</template>
