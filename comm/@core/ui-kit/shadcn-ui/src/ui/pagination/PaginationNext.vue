<!--
 * 分页器的「下一页」按钮：默认开启 asChild，外观由 Button 的 outline 变体提供。
 *
 * 处于末页时由 radix 自动置为 disabled，
 * 因此调用方不需要自行判断页码边界，也就不存在边界判断与渲染不同步的隐患。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\PaginationNext.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationNextProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronRight } from 'lucide-vue-next';
import { PaginationNext } from 'radix-vue';

import { Button } from '../button';

const props = withDefaults(
  defineProps<PaginationNextProps & { class?: any }>(),
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
  <PaginationNext v-bind="delegatedProps">
    <Button :class="cn('size-8 p-0', props.class)" variant="outline">
      <slot>
        <ChevronRight class="size-4" />
      </slot>
    </Button>
  </PaginationNext>
</template>
