<!--
 * 右键菜单分隔线：在菜单项之间绘制视觉分组线。
 *
 * 纯装饰元素，对辅助技术不可见；语义分组应通过 YdContextMenuGroup 表达，
 * 不要用它替代分组。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuSeparator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ContextMenuSeparatorProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdContextMenuSeparator } from '@ydsz-core/ydsz-vue';

const props = defineProps<ContextMenuSeparatorProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <YdContextMenuSeparator
    v-bind="delegatedProps"
    :class="cn('bg-border -mx-1 my-1 h-px', props.class)"
  />
</template>
