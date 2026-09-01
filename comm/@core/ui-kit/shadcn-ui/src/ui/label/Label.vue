<!--
 * 通用标签：转发 radix Label 的 props，并统一字号、行高与禁用态表现。
 *
 * peer-disabled 类让标签能感知同级控件的禁用状态；
 * 这依赖 Tailwind 的 peer 机制，故标签必须与控件同级相邻，不可再包一层容器。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\label\Label.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { LabelProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Label } from 'radix-vue';

const props = defineProps<LabelProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
  >
    <slot></slot>
  </Label>
</template>
