<!--
 * 对话框关闭触发器：包装 radix DialogClose，点击即关闭对话框。
 *
 * 以按钮语义渲染，因此键盘与读屏可直接操作；用于「取消」「知道了」这类
 * 不需要额外处理的关闭动作。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogClose.vue
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
