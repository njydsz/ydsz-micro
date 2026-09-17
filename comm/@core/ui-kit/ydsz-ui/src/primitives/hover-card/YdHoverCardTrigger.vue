<!--
 * 悬停卡片的触发器：转发 radix YdHoverCardTrigger 的 props，支持 asChild 套到任意元素上。
 *
 * 本组件不接管样式，触发器外观完全由传入的元素决定 ——
 * 因为触发区可能是链接、头像、表格单元格，形态差异过大，统一反而是限制。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\hover-card\YdHoverCardTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { HoverCardTriggerProps } from '@ydsz-core/ydsz-vue';

import { YdHoverCardTrigger } from '@ydsz-core/ydsz-vue';

const props = defineProps<HoverCardTriggerProps>();
</script>

<template>
  <YdHoverCardTrigger v-bind="props">
    <slot></slot>
  </YdHoverCardTrigger>
</template>
