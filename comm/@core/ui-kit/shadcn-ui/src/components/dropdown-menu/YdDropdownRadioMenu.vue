<!--
 * 单选下拉菜单：菜单项带选中标记，用于表达「当前是哪一个」。
 *
 * 与普通下拉菜单的区别仅在选中态的呈现，因此独立成组件而不是给菜单项加一个
 * checked 字段 —— 单选语义下需要额外的 role 与键盘行为，混在一起会让普通菜单
 * 背负不必要的无障碍负担。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dropdown-menu\dropdown-radio-menu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { DropdownMenuProps } from './interface';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui';

type Props = DropdownMenuProps;

defineOptions({ name: 'DropdownRadioMenu' });
withDefaults(defineProps<Props>(), {});

const modelValue = defineModel<string>();

function handleItemClick(value: string) {
  modelValue.value = value;
}
</script>
<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child class="flex items-center gap-1">
      <slot></slot>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuGroup>
        <template v-for="menu in menus" :key="menu.key">
          <DropdownMenuItem
            :class="
              menu.value === modelValue
                ? 'bg-accent text-accent-foreground'
                : ''
            "
            class="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground text-foreground/80 mb-1 cursor-pointer"
            @click="handleItemClick(menu.value)"
          >
            <component :is="menu.icon" v-if="menu.icon" class="mr-2 size-4" />
            <span
              v-if="!menu.icon"
              :class="menu.value === modelValue ? 'bg-foreground' : ''"
              class="mr-2 size-1.5 rounded-full"
            ></span>
            {{ menu.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

