<!--
 * 右键菜单分组：为一组菜单项提供语义分组。
 *
 * 分组信息会传达给辅助技术，便于按组浏览；视觉上不额外绘制分隔线，
 * 需要分隔请配合 ContextMenuSeparator 使用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuGroupProps } from 'radix-vue';

import { ContextMenuGroup } from 'radix-vue';

const props = defineProps<ContextMenuGroupProps>();
</script>

<template>
  <ContextMenuGroup v-bind="props">
    <slot></slot>
  </ContextMenuGroup>
</template>
