<!--
 * 数字输入框的减小按钮：绝对定位在输入区左侧，默认图标为 Minus。
 *
 * 打上 data-slot="decrement" 是给 NumberFieldContent 的选择器用的 ——
 * 父级据此判断要不要给输入框让出左边距，因此更换图标时该属性必须保留。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\NumberFieldDecrement.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { NumberFieldDecrementProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Minus } from 'lucide-vue-next';
import { NumberFieldDecrement, useForwardProps } from 'radix-vue';

const props = defineProps<NumberFieldDecrementProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NumberFieldDecrement
    data-slot="decrement"
    v-bind="forwarded"
    :class="
      cn(
        'absolute left-0 top-1/2 -translate-y-1/2 p-3 disabled:cursor-not-allowed disabled:opacity-20',
        props.class,
      )
    "
  >
    <slot>
      <Minus class="h-4 w-4" />
    </slot>
  </NumberFieldDecrement>
</template>
