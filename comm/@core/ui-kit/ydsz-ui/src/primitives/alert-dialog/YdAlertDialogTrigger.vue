<!--
 * YdAlertDialogTrigger —— 触发 AlertDialog 打开的按钮，样式透传给子元素。
 *
 * 基于 ydsz-vue 的 AlertDialogTrigger 封装，支持 as-child 模式，
 * 可将触发器样式套到 RouterLink 或第三方组件上。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\alert-dialog\YdAlertDialogTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import type { AlertDialogTriggerProps } from '@ydsz-core/ydsz-vue';

import { AlertDialogTrigger, useForwardProps } from '@ydsz-core/ydsz-vue';

const props = defineProps<AlertDialogTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <AlertDialogTrigger v-bind="forwarded">
    <slot />
  </AlertDialogTrigger>
</template>
