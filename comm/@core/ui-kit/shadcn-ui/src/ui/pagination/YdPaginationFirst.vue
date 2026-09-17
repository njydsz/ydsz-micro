<!--
 * 分页器的「回到首页」按钮：默认开启 asChild，把 radix 的行为套到 YdButtonBase 上。
 *
 * asChild 默认为 true 是这里的关键 —— 若渲染成 radix 自带的 button，
 * 就会同时套上两套按钮样式；本项目统一由 YdButtonBase 提供外观，radix 只负责行为与禁用态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\YdPaginationFirst.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationFirstProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { ChevronsLeft } from 'lucide-vue-next';
import { YdPaginationFirst } from 'radix-vue';

import { YdButtonBase } from '../button';

const props = withDefaults(
  defineProps<PaginationFirstProps & { class?: any }>(),
  {
    asChild: true,
  },
);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <YdPaginationFirst v-bind="delegatedProps">
    <YdButtonBase :class="cn('size-8 p-0', props.class)" variant="outline">
      <slot>
        <ChevronsLeft class="size-4" />
      </slot>
    </YdButtonBase>
  </YdPaginationFirst>
</template>
