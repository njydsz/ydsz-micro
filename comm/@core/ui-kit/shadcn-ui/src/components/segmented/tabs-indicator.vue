<!--
 * 分段控制器中随选中项滑动的指示块：位置直接消费 radix Tabs 暴露的
 * --radix-tabs-indicator-position 变量做 translate，宽度默认 w-1/2，
 * 由父级 segmented 按分段数量以内联 style 覆盖。
 *
 * class 先从 props 中剥离再转发，使 absolute / left-0 / translate 等定位原子类
 * 与调用方自定义样式经 cn() 合并，而不是被整体替换掉。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\segmented\tabs-indicator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabsIndicatorProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { TabsIndicator, useForwardProps } from 'radix-vue';

const props = defineProps<TabsIndicatorProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsIndicator
    v-bind="forwardedProps"
    :class="
      cn(
        'absolute bottom-0 left-0 z-10 h-full w-1/2 translate-x-[--radix-tabs-indicator-position] rounded-full px-0 py-1 pr-1 transition-[width,transform] duration-300',
        props.class,
      )
    "
  >
    <div
      class="bg-background text-foreground inline-flex h-full w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      <slot></slot>
    </div>
  </TabsIndicator>
</template>
