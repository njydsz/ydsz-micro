<!--
 * 标签页的切换按钮：激活态由 radix 的 data-state=active 驱动。
 *
 * whitespace-nowrap 是必要的 —— 标签文字换行会把标签栏撑高，
 * 切换时出现整条标签栏跳动；禁用态用 disabled 属性选择器，
 * 因为 radix 会把它透传到原生按钮上。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\TabsTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabsTriggerProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { TabsTrigger, useForwardProps } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<TabsTriggerProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow',
        props.class,
      )
    "
  >
    <slot></slot>
  </TabsTrigger>
</template>
