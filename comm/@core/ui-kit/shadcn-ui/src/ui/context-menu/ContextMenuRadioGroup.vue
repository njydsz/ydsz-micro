<!--
 * 右键菜单单选组：为一组 ContextMenuRadioItem 提供互斥的选中上下文。
 *
 * 互斥语义由 radix 维护（含键盘导航与 aria 角色），包装层不介入取值逻辑。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuRadioGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  ContextMenuRadioGroupEmits,
  ContextMenuRadioGroupProps,
} from 'radix-vue';

import { ContextMenuRadioGroup, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<ContextMenuRadioGroupProps>();
const emits = defineEmits<ContextMenuRadioGroupEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuRadioGroup v-bind="forwarded">
    <slot></slot>
  </ContextMenuRadioGroup>
</template>
