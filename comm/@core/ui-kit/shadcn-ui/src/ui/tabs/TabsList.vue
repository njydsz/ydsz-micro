<!--
 * 标签栏：承载一组 TabsTrigger，并提供底部灰色轨道作为未激活态的背景。
 *
 * 固定高度 h-9 与内边距 p-1，让激活项的高亮块比轨道略小一圈，
 * 形成「轨道内嵌滑块」的观感；高度写死在标签栏而非触发器上，
 * 可避免各触发器高度不一致导致的抖动。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\TabsList.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabsListProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { TabsList } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<TabsListProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1',
        props.class,
      )
    "
  >
    <slot></slot>
  </TabsList>
</template>
