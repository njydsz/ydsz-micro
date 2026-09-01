<!--
 * 右键菜单触发器：包裹触发区域，在右键时展开菜单。
 *
 * 触发区域应只包含需要响应右键的元素：范围过大会屏蔽页面其它区域的右键菜单，
 * 影响用户复制、检查等原生操作。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuTriggerProps } from 'radix-vue';

import { ContextMenuTrigger, useForwardProps } from 'radix-vue';

const props = defineProps<ContextMenuTriggerProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <ContextMenuTrigger v-bind="forwardedProps">
    <slot></slot>
  </ContextMenuTrigger>
</template>
