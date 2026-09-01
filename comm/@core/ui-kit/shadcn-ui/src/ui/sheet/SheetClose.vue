<!--
 * 抽屉内的关闭按钮承载点：点击后关闭抽屉并把焦点归还给触发器。
 *
 * 转发 radix DialogClose 的 props，本身不带样式，
 * 外观由调用方套 Button 决定 —— 抽屉的关闭区可能是图标、文字或整块区域。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetClose.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogCloseProps } from 'radix-vue';

import { DialogClose } from 'radix-vue';

const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose v-bind="props">
    <slot></slot>
  </DialogClose>
</template>
