<!--
 * 右键菜单内容浮层：包装 radix YdContextMenuContent，定义浮层的定位与外观。
 *
 * 浮层以 Portal 形式挂到 body，避免被父级 overflow 裁剪或受祖先 z-index 影响。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  ContextMenuContentEmits,
  ContextMenuContentProps,
} from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  YdContextMenuContent,
  YdContextMenuPortal,
  useForwardPropsEmits,
} from '@ydsz-core/ydsz-vue';

const props = defineProps<ContextMenuContentProps & { class?: any }>();
const emits = defineEmits<ContextMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <YdContextMenuPortal>
    <YdContextMenuContent
      v-bind="forwarded"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border z-popup min-w-32 overflow-hidden rounded-md border p-1 shadow-md',
          props.class,
        )
      "
    >
      <slot></slot>
    </YdContextMenuContent>
  </YdContextMenuPortal>
</template>
