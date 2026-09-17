<!--
 * 选项之间的分隔线：用于区分不同性质的选项（如「常用」与「全部」）。
 *
 * 左右各取 -mx-1 的负外边距，让分隔线铺满面板的内容宽度，
 * 而不是被 YdSelectContentBase 的内边距截断成一小段。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\YdSelectSeparatorBase.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectSeparatorProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdSelectSeparatorBase } from 'radix-vue';

const props = defineProps<SelectSeparatorProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <YdSelectSeparatorBase
    v-bind="delegatedProps"
    :class="cn('bg-muted -mx-1 my-1 h-px', props.class)"
  />
</template>
