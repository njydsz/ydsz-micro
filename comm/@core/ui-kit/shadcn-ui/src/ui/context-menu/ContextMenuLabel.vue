<!--
 * 右键菜单分组标题：为一组菜单项提供说明性标题。
 *
 * 纯展示元素、不可聚焦，因此不参与键盘导航序列；
 * 需要可点击的标题请改用 ContextMenuItem。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuLabel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuLabelProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ContextMenuLabel } from 'radix-vue';

const props = defineProps<
  ContextMenuLabelProps & { class?: any; inset?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ContextMenuLabel
    v-bind="delegatedProps"
    :class="
      cn(
        'text-foreground px-2 py-1.5 text-sm font-semibold',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot></slot>
  </ContextMenuLabel>
</template>
