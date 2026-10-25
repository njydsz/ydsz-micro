<!--
 * 选择器的触发器：展示当前选中项文本，右侧固定带下拉箭头。
 *
 * [&>span]:line-clamp-1 是必要的 —— 长选项会把触发器撑高，
 * 导致表单行高忽大忽小；单行截断后高度恒定，完整文本仍可在下拉面板里读到。
 * 箭头用 SelectIcon 包一层，由 radix 控制展开时的旋转状态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectTriggerProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { ChevronDown } from 'lucide-vue-next';
import { SelectIcon, SelectTrigger, useForwardProps } from '@ydsz-core/ydsz-vue';

import { useDensity } from '../../composables/use-density';

const props = defineProps<SelectTriggerProps & { class?: any }>();

/** 全局密度 */
const density = useDensity();

/** 密度追加类名 */
const densitySelectClass = computed(() => {
  switch (density.value) {
    case 'compact':
      return 'h-7 px-2 text-xs';
    case 'large':
      return 'h-11 px-3 text-base';
    default:
      return '';
  }
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        densitySelectClass,
        props.class,
      )
    "
  >
    <slot></slot>
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
