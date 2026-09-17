<!--
 * 选项之间的分隔线：用于区分不同性质的选项（如「常用」与「全部」）。
 *
 * 左右各取 -mx-1 的负外边距，让分隔线铺满面板的内容宽度，
 * 而不是被 YdSelectContent 的内边距截断成一小段。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectSeparator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectSeparatorProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdSelectSeparator } from '@ydsz-core/ydsz-vue';

const props = defineProps<SelectSeparatorProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <YdSelectSeparator
    v-bind="delegatedProps"
    :class="cn('bg-muted -mx-1 my-1 h-px', props.class)"
  />
</template>
