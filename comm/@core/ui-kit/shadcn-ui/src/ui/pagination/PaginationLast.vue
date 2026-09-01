<!--
 * 分页器的「跳到末页」按钮：默认开启 asChild，把 radix 的行为套到 Button 上。
 *
 * 与首页按钮同理：外观交给 Button，radix 只提供行为与到达边界后的禁用态，
 * 避免两套按钮样式互相覆盖。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\PaginationLast.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PaginationLastProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronsRight } from 'lucide-vue-next';
import { PaginationLast } from 'radix-vue';

import { Button } from '../button';

const props = withDefaults(
  defineProps<PaginationLastProps & { class?: any }>(),
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
  <PaginationLast v-bind="delegatedProps">
    <Button :class="cn('size-8 p-0', props.class)" variant="outline">
      <slot>
        <ChevronsRight class="size-4" />
      </slot>
    </Button>
  </PaginationLast>
</template>
