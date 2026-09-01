<!--
 * 下拉菜单分组：为菜单项提供语义分组。
 *
 * 分组只传达语义、不绘制分隔线，需要视觉分隔请配合 Separator 使用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuGroupProps } from 'radix-vue';

import { DropdownMenuGroup } from 'radix-vue';

const props = defineProps<DropdownMenuGroupProps>();
</script>

<template>
  <DropdownMenuGroup v-bind="props">
    <slot></slot>
  </DropdownMenuGroup>
</template>
