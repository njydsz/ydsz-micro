<!--
 * 对话框根容器：包装 radix DialogRoot，持有对话框的开关状态。
 *
 * 支持 v-model:open 受控；不传时由 radix 内部维护非受控状态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\Dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'radix-vue';

import { DialogRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot></slot>
  </DialogRoot>
</template>
