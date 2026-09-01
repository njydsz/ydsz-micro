<!--
 * 子菜单的入口项：点击或悬停后展开二级菜单，右侧固定带一个 ChevronRight 箭头。
 *
 * 箭头写死在组件内而非交给插槽，是为了保证全站「有下级」的视觉提示一致；
 * 需要更换图标时应改这里，而不是在每个调用处各写一遍。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuSubTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuSubTriggerProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronRight } from 'lucide-vue-next';
import { DropdownMenuSubTrigger, useForwardProps } from 'radix-vue';

const props = defineProps<DropdownMenuSubTriggerProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuSubTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        props.class,
      )
    "
  >
    <slot></slot>
    <ChevronRight class="ml-auto h-4 w-4" />
  </DropdownMenuSubTrigger>
</template>
