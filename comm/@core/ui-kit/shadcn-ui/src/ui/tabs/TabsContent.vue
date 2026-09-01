<!--
 * 标签页的内容面板：与 TabsTrigger 通过 value 配对，只有激活项被渲染。
 *
 * mt-2 的间距写在这里而不是面板内部，是为了让内容与标签栏的距离在不同面板间保持一致；
 * 未激活面板默认不挂载，因此面板内的组件状态会随切换丢失，
 * 需要保活时应自行加 keep-alive 或用 v-show 替代。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\TabsContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabsContentProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { TabsContent } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<TabsContentProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsContent
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        props.class,
      )
    "
    v-bind="delegatedProps"
  >
    <slot></slot>
  </TabsContent>
</template>
