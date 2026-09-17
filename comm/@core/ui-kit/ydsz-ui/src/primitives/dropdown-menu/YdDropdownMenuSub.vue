<!--
 * 下拉子菜单容器：包装 radix YdDropdownMenuSub，持有子菜单的展开状态。
 *
 * 与根容器分离是因为子菜单的展开方向、延迟与键盘进出规则不同，
 * 共用一套配置会互相干扰。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\YdDropdownMenuSub.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuSubEmits, DropdownMenuSubProps } from 'radix-vue';

import { YdDropdownMenuSub, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<DropdownMenuSubProps>();
const emits = defineEmits<DropdownMenuSubEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <YdDropdownMenuSub v-bind="forwarded">
    <slot></slot>
  </YdDropdownMenuSub>
</template>
