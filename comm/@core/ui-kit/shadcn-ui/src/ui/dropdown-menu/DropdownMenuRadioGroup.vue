<!--
 * 下拉菜单单选组：为一组单选项提供互斥的选中上下文。
 *
 * 互斥与键盘导航由 radix 维护，包装层不介入取值逻辑。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuRadioGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  DropdownMenuRadioGroupEmits,
  DropdownMenuRadioGroupProps,
} from 'radix-vue';

import { DropdownMenuRadioGroup, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<DropdownMenuRadioGroupProps>();
const emits = defineEmits<DropdownMenuRadioGroupEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRadioGroup v-bind="forwarded">
    <slot></slot>
  </DropdownMenuRadioGroup>
</template>
