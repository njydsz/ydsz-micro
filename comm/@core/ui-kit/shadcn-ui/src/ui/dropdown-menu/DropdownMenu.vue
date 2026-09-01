<!--
 * 下拉菜单根容器：包装 radix DropdownMenuRoot，持有菜单的开关状态。
 *
 * 与右键菜单的差别只在触发方式（点击 vs 右键），其余部件可对照使用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuRootEmits, DropdownMenuRootProps } from 'radix-vue';

import { DropdownMenuRoot, useForwardPropsEmits } from 'radix-vue';

const props = withDefaults(defineProps<DropdownMenuRootProps>(), {
  modal: false,
});
const emits = defineEmits<DropdownMenuRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRoot v-bind="forwarded">
    <slot></slot>
  </DropdownMenuRoot>
</template>
