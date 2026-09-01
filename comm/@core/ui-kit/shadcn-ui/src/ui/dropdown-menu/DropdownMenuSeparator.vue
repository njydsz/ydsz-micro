<!--
 * 下拉菜单分隔线：在菜单项之间绘制视觉分组线。
 *
 * 纯装饰元素，对辅助技术不可见；语义分组请用 DropdownMenuGroup 表达。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\DropdownMenuSeparator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DropdownMenuSeparatorProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DropdownMenuSeparator } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<
  DropdownMenuSeparatorProps & {
    class?: ClassValue;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DropdownMenuSeparator
    v-bind="delegatedProps"
    :class="cn('bg-border -mx-1 my-1 h-px', props.class)"
  />
</template>
