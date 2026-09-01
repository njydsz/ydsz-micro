<!--
 * 标签栏溢出时的「更多」下拉入口。
 *
 * modal 固定传 false：菜单打开时若加遮罩，会挡住标签栏本身，
 * 用户无法在菜单展开状态下对照其它标签。
 *
 * @path comm\@core\ui-kit\tabs-ui\src\components\widgets\tool-more.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { DropdownMenuProps } from '@YDSZ-core/shadcn-ui';

import { ChevronDown } from '@YDSZ-core/icons';
import { YDSZDropdownMenu } from '@YDSZ-core/shadcn-ui';

defineProps<DropdownMenuProps>();
</script>

<template>
  <YDSZDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center hover:bg-muted hover:text-foreground text-muted-foreground border-border h-full cursor-pointer border-l px-2 text-lg font-semibold"
    >
      <ChevronDown class="size-4" />
    </div>
  </YDSZDropdownMenu>
</template>
