<!--
 * 悬停卡片的容器：转发 radix HoverCardRoot 的全部 props 与 emits。
 *
 * 与 Tooltip 的取舍：HoverCard 的浮层可以承载可交互内容（链接、按钮），
 * 鼠标可以移入浮层而不消失；Tooltip 只能放纯文本，且移入即消失。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\hover-card\HoverCard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { HoverCardRootEmits, HoverCardRootProps } from 'radix-vue';

import { HoverCardRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<HoverCardRootProps>();
const emits = defineEmits<HoverCardRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <HoverCardRoot v-bind="forwarded">
    <slot></slot>
  </HoverCardRoot>
</template>
