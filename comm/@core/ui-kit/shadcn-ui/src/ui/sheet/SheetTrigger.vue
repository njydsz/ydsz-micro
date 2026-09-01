<!--
 * 抽屉的触发器：转发 radix DialogTrigger 的 props，支持 asChild。
 *
 * 不带样式，触发区形态由调用方决定；
 * 打开状态由 Sheet 统一管理，触发器自身不保存任何状态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogTriggerProps } from 'radix-vue';

import { DialogTrigger } from 'radix-vue';

const props = defineProps<DialogTriggerProps>();
</script>

<template>
  <DialogTrigger v-bind="props">
    <slot></slot>
  </DialogTrigger>
</template>
