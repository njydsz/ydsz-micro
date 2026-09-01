<!--
 * 分页器的「上一页」按钮：默认开启 asChild，外观由 Button 的 outline 变体提供。
 *
 * 处于首页时由 radix 自动置为 disabled，边界状态由组件内部托管，
 * 调用方只需关心当前页码。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\PaginationPrev.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationPrevProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronLeft } from 'lucide-vue-next';
import { PaginationPrev } from 'radix-vue';

import { Button } from '../button';

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
  <PaginationPrev v-bind="delegatedProps">
    <Button :class="cn('size-8 p-0', props.class)" variant="outline">
      <slot>
        <ChevronLeft class="size-4" />
      </slot>
    </Button>
  </PaginationPrev>
</template>
