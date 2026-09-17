<!--
 * 分页器的「上一页」按钮：默认开启 asChild，外观由 YdButtonBase 的 outline 变体提供。
 *
 * 处于首页时由 radix 自动置为 disabled，边界状态由组件内部托管，
 * 调用方只需关心当前页码。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\YdPaginationPrev.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationPrevProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { ChevronLeft } from 'lucide-vue-next';
import { YdPaginationPrev } from 'radix-vue';

import { YdButtonBase } from '../button';

const props = withDefaults(
  defineProps<PaginationPrevProps & { class?: any }>(),
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
  <YdPaginationPrev v-bind="delegatedProps">
    <YdButtonBase :class="cn('size-8 p-0', props.class)" variant="outline">
      <slot>
        <ChevronLeft class="size-4" />
      </slot>
    </YdButtonBase>
  </YdPaginationPrev>
</template>
