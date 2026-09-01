<!--
 * 侧边面板的容器：底层复用 DialogRoot，因此打开/关闭、焦点管理、Esc 关闭等行为与 Dialog 完全一致。
 *
 * 复用而非另起一套，是因为抽屉本质上就是「从屏幕边缘出现的对话框」；
 * 差异只体现在内容区的方位动画（见 SheetContent）上。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\Sheet.vue
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
