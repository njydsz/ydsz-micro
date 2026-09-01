<!--
 * 下拉菜单的子菜单面板：承载二级菜单的浮层容器与进出场动画。
 *
 * 动画类名按 data-side 分别定义四个方向的滑入偏移，
 * 因为子菜单总是从父级侧边展开，用同一套位移会导致上下方向出现反向滑动。
 * class 先从 props 中剥离再合并，保证浮层定位与动画类不被调用方覆盖掉。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuSubContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  DropdownMenuSubContentEmits,
  DropdownMenuSubContentProps,
} from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DropdownMenuSubContent, useForwardPropsEmits } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<DropdownMenuSubContentProps & { class?: ClassValue }>();
const emits = defineEmits<DropdownMenuSubContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DropdownMenuSubContent
    v-bind="forwarded"
    :class="
      cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-lg',
        props.class,
      )
    "
  >
    <slot></slot>
  </DropdownMenuSubContent>
</template>
