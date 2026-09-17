<!--
 * 下拉菜单项：包装 radix YdDropdownMenuItem，补充 inset 对齐选项。
 *
 * inset 用于与带图标或勾选标记的项保持左对齐；这些标记占用固定前置宽度，
 * 混排时未开启 inset 的项会显得缩进不足。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\YdDropdownMenuItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuItemProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdDropdownMenuItem, useForwardProps } from '@ydsz-core/ydsz-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<
  DropdownMenuItemProps & { class?: ClassValue; inset?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <YdDropdownMenuItem
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot></slot>
  </YdDropdownMenuItem>
</template>
