<!--
 * 右键子菜单容器：包装 radix ContextMenuSub，持有子菜单的展开状态。
 *
 * 与根容器分开是因为子菜单的展开方向、延迟与键盘进出规则都不同，
 * 复用根容器会让配置互相干扰。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuSub.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'radix-vue';

import { ContextMenuSub, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<ContextMenuSubProps>();
const emits = defineEmits<ContextMenuSubEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuSub v-bind="forwarded">
    <slot></slot>
  </ContextMenuSub>
</template>
