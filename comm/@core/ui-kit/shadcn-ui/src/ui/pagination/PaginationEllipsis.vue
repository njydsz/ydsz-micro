<!--
 * 分页器中的页码省略占位：代表被折叠的页码区间，不可点击。
 *
 * 固定为 32px 见方（size-8），与相邻页码按钮保持等高，
 * 否则页码行会出现纵向跳动；默认图标 MoreHorizontal 可用插槽替换。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\PaginationEllipsis.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationEllipsisProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { MoreHorizontal } from 'lucide-vue-next';
import { PaginationEllipsis } from 'radix-vue';

const props = defineProps<PaginationEllipsisProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <PaginationEllipsis
    v-bind="delegatedProps"
    :class="cn('flex size-8 items-center justify-center', props.class)"
  >
    <slot>
      <MoreHorizontal class="size-4" />
    </slot>
  </PaginationEllipsis>
</template>
