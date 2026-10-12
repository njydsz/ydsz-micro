<!--
 * 选项列表顶部的滚动按钮：列表上方还有内容时由 radix 自动显示。
 *
 * 与向下按钮成对提供，用于在有限高度的面板里提示「还有更多选项」；
 * 它的存在也是列表高度被约束的信号，长列表应考虑改用它而不是无限增高面板。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectScrollUpButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectScrollUpButtonProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { ChevronUp } from 'lucide-vue-next';
import { YdSelectScrollUpButton, useForwardProps } from '@ydsz-core/ydsz-vue';

const props = defineProps<SelectScrollUpButtonProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <YdSelectScrollUpButton
    v-bind="forwardedProps"
    :class="
      cn('flex cursor-default items-center justify-center py-1', props.class)
    "
  >
    <slot>
      <ChevronUp class="h-4 w-4" />
    </slot>
  </YdSelectScrollUpButton>
</template>
