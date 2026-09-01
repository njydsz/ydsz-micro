<!--
 * 选项列表底部的滚动按钮：列表可继续向下滚动时由 radix 自动显示。
 *
 * 显隐完全由 radix 判断溢出状态，调用方既不需要传参也不需要控制显示，
 * 因此不要试图用 v-if 自行控制它的出现时机。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\SelectScrollDownButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectScrollDownButtonProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronDown } from 'lucide-vue-next';
import { SelectScrollDownButton, useForwardProps } from 'radix-vue';

const props = defineProps<SelectScrollDownButtonProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectScrollDownButton
    v-bind="forwardedProps"
    :class="
      cn('flex cursor-default items-center justify-center py-1', props.class)
    "
  >
    <slot>
      <ChevronDown class="h-4 w-4" />
    </slot>
  </SelectScrollDownButton>
</template>
