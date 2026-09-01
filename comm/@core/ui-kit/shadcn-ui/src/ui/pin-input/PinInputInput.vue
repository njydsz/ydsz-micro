<!--
 * 验证码输入的单个格子：只接受一位字符，宽度固定、文本居中。
 *
 * 相邻格子共享边框（border-y + border-r + first:border-l）而不是各自画一圈，
 * 否则中间线会是 2px；聚焦时提升 z-index 并补 ring，避免ring 被相邻格子盖住一半。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pin-input\PinInputInput.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PinInputInputProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { PinInputInput, useForwardProps } from 'radix-vue';

const props = defineProps<PinInputInputProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <PinInputInput
    v-bind="forwardedProps"
    :class="
      cn(
        'border-input bg-background relative flex h-10 w-8 items-center justify-center border-y border-r text-center text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md focus:relative focus:z-10 focus:outline-none focus:ring-2 md:w-10',
        props.class,
      )
    "
  />
</template>
