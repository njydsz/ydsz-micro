<!--
 * tool-more 通用组件
 *
 * @path comm\@core\ui-kit\tabs-ui\src\components\widgets\tool-more.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { DropdownMenuProps } from '@remi-core/shadcn-ui';

import { ChevronDown } from '@remi-core/icons';
import { REMIDropdownMenu } from '@remi-core/shadcn-ui';

defineProps<DropdownMenuProps>();
</script>

<template>
  <REMIDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center hover:bg-muted hover:text-foreground text-muted-foreground border-border h-full cursor-pointer border-l px-2 text-lg font-semibold"
    >
      <ChevronDown class="size-4" />
    </div>
  </REMIDropdownMenu>
</template>
