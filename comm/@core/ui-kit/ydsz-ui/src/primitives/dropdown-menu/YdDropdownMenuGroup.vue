<!--
 * 下拉菜单分组：为菜单项提供语义分组。
 *
 * 分组只传达语义、不绘制分隔线，需要视觉分隔请配合 YdSeparator 使用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\YdDropdownMenuGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuGroupProps } from '@ydsz-core/ydsz-vue';

import { YdDropdownMenuGroup } from '@ydsz-core/ydsz-vue';

const props = defineProps<DropdownMenuGroupProps>();
</script>

<template>
  <YdDropdownMenuGroup v-bind="props">
    <slot></slot>
  </YdDropdownMenuGroup>
</template>
