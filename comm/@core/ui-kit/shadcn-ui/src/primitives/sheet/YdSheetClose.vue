<!--
 * 抽屉内的关闭按钮承载点：点击后关闭抽屉并把焦点归还给触发器。
 *
 * 转发 radix YdDialogClose 的 props，本身不带样式，
 * 外观由调用方套 YdButton 决定 —— 抽屉的关闭区可能是图标、文字或整块区域。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\YdSheetClose.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogCloseProps } from 'radix-vue';

import { YdDialogClose } from 'radix-vue';

const props = defineProps<DialogCloseProps>();
</script>

<template>
  <YdDialogClose v-bind="props">
    <slot></slot>
  </YdDialogClose>
</template>
