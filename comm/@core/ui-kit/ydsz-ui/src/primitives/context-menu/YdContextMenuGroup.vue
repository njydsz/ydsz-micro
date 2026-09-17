<!--
 * 右键菜单分组：为一组菜单项提供语义分组。
 *
 * 分组信息会传达给辅助技术，便于按组浏览；视觉上不额外绘制分隔线，
 * 需要分隔请配合 YdContextMenuSeparator 使用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuGroupProps } from 'radix-vue';

import { YdContextMenuGroup } from 'radix-vue';

const props = defineProps<ContextMenuGroupProps>();
</script>

<template>
  <YdContextMenuGroup v-bind="props">
    <slot></slot>
  </YdContextMenuGroup>
</template>
