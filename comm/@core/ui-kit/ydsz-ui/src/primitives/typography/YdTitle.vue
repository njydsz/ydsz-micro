<!--
 * Typography.Title：语义化标题，带 level 1-5。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 标题级别 1-5 */
  level?: 1 | 2 | 3 | 4 | 5;
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
});

const tag = computed(() => `h${props.level}` as const);

const levelClass: Record<number, string> = {
  1: 'text-4xl font-bold tracking-tight',
  2: 'text-3xl font-semibold tracking-tight',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-semibold',
  5: 'text-lg font-medium',
};
</script>

<template>
  <component :is="tag" :class="cn('text-foreground', levelClass[props.level], props.class)">
    <slot></slot>
  </component>
</template>
