<!--
 * 右键菜单根容器：包装 radix ContextMenuRoot，承载菜单的开关状态。
 *
 * 本身不渲染任何可见元素，只提供状态上下文；触发器与内容分别由
 * ContextMenuTrigger / ContextMenuContent 提供。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuRootEmits, ContextMenuRootProps } from 'radix-vue';

import { ContextMenuRoot, useForwardPropsEmits } from 'radix-vue';

const props = withDefaults(defineProps<ContextMenuRootProps>(), {
  modal: false,
});
const emits = defineEmits<ContextMenuRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuRoot v-bind="forwarded">
    <slot></slot>
  </ContextMenuRoot>
</template>
