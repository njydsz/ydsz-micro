<!--
 * 数字输入框的增大按钮：绝对定位在输入区右侧，默认图标为 Plus。
 *
 * 与减小按钮成对出现是常态，但两者独立可用：
 * 只保留一个时另一侧的内边距会被 NumberFieldContent 自动收回。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\NumberFieldIncrement.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { NumberFieldIncrementProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Plus } from 'lucide-vue-next';
import { NumberFieldIncrement, useForwardProps } from 'radix-vue';

const props = defineProps<NumberFieldIncrementProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NumberFieldIncrement
    data-slot="increment"
    v-bind="forwarded"
    :class="
      cn(
        'absolute right-0 top-1/2 -translate-y-1/2 p-3 disabled:cursor-not-allowed disabled:opacity-20',
        props.class,
      )
    "
  >
    <slot>
      <Plus class="h-4 w-4" />
    </slot>
  </NumberFieldIncrement>
</template>
