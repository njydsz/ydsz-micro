<!--
 * 右键菜单传送门：包装 radix YdContextMenuPortalBase，把浮层挂到 body。
 *
 * 独立暴露出来是为了让调用方自行决定传送目标（如挂到某个弹层容器而非 body），
 * 这在嵌套弹层里是控制堆叠顺序的关键。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\YdContextMenuPortalBase.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuPortalProps } from 'radix-vue';

import { YdContextMenuPortalBase } from 'radix-vue';

const props = defineProps<ContextMenuPortalProps>();
</script>

<template>
  <YdContextMenuPortalBase v-bind="props">
    <slot></slot>
  </YdContextMenuPortalBase>
</template>
