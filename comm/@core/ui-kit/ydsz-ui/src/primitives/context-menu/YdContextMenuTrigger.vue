<!--
 * 右键菜单触发器：包裹触发区域，在右键时展开菜单。
 *
 * 触发区域应只包含需要响应右键的元素：范围过大会屏蔽页面其它区域的右键菜单，
 * 影响用户复制、检查等原生操作。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuTriggerProps } from '@ydsz-core/ydsz-vue';

import { YdContextMenuTrigger, useForwardProps } from '@ydsz-core/ydsz-vue';

const props = defineProps<ContextMenuTriggerProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <YdContextMenuTrigger v-bind="forwardedProps">
    <slot></slot>
  </YdContextMenuTrigger>
</template>
