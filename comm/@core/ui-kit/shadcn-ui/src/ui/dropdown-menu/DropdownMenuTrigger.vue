<!--
 * 下拉菜单的触发器：转发 radix 的全部 props（如 disabled、asChild）。
 *
 * 固定去掉聚焦描边（outline-none）—— 触发器的聚焦状态由菜单项接管，
 * 否则打开菜单后会同时出现两处焦点环；若需要键盘可达的视觉反馈，应在内容区自行实现。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuTriggerProps } from 'radix-vue';

import { DropdownMenuTrigger, useForwardProps } from 'radix-vue';

const props = defineProps<DropdownMenuTriggerProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuTrigger class="outline-none" v-bind="forwardedProps">
    <slot></slot>
  </DropdownMenuTrigger>
</template>
