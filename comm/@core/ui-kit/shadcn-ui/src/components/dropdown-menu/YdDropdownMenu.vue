<!--
 * 下拉菜单：由菜单数据渲染可点击的下拉项。
 *
 * 与右键菜单共用同一套数据驱动思路：菜单项在数据中描述，默认插槽承载触发器。
 * 两者分开是因为触发方式（点击 vs 右键）与定位逻辑不同，合并会让配置变复杂。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dropdown-menu\dropdown-menu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type {
  DropdownMenuProps,
  YdDropdownMenuItem as IDropdownMenuItem,
} from './interface';

import {
  YdDropdownMenuBase,
  YdDropdownMenuContentBase,
  YdDropdownMenuGroupBase,
  YdDropdownMenuItemBase,
  YdDropdownMenuSeparatorBase,
  YdDropdownMenuTriggerBase,
} from '../../ui';

type Props = DropdownMenuProps;

defineOptions({ name: 'YdDropdownMenuBase' });
const props = withDefaults(defineProps<Props>(), {});

function handleItemClick(menu: IDropdownMenuItem) {
  if (menu.disabled) {
    return;
  }
  menu?.handler?.(props);
}
</script>
<template>
  <YdDropdownMenuBase>
    <YdDropdownMenuTriggerBase class="flex h-full items-center gap-1" aria-haspopup="menu">
      <slot></slot>
    </YdDropdownMenuTriggerBase>
    <YdDropdownMenuContentBase align="start" role="menu">
      <YdDropdownMenuGroupBase>
        <template v-for="menu in menus" :key="menu.value">
          <YdDropdownMenuItemBase
            :disabled="menu.disabled"
            class="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground text-foreground/80 mb-1 cursor-pointer"
            role="menuitem"
            :aria-label="menu.label"
            @click="handleItemClick(menu)"
          >
            <component :is="menu.icon" v-if="menu.icon" class="mr-2 size-4" aria-hidden="true" />
            {{ menu.label }}
          </YdDropdownMenuItemBase>
          <YdDropdownMenuSeparatorBase v-if="menu.separator" class="bg-border" role="separator" />
        </template>
      </YdDropdownMenuGroupBase>
    </YdDropdownMenuContentBase>
  </YdDropdownMenuBase>
</template>

