<!--
 * 右键菜单项：包装 radix ContextMenuItem，补充 inset 对齐选项。
 *
 * inset 用于让本项与带图标/勾选标记的项左对齐 —— 这些标记会占用固定的前置宽度，
 * 混排时未开启 inset 的项会显得缩进不足。
 * props 中的 class 会先剥离再转发，交由 cn 统一合并，避免重复应用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ContextMenuItem, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<
  ContextMenuItemProps & { class?: any; inset?: boolean }
>();
const emits = defineEmits<ContextMenuItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ContextMenuItem
    v-bind="forwarded"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot></slot>
  </ContextMenuItem>
</template>
