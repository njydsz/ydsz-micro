<!--
 * 验证码/口令输入的容器：转发 radix PinInputRoot 的 props 与 emits。
 *
 * 自动聚焦、退格回跳、粘贴分发等键盘行为全部由 radix 托管，
 * 本组件只负责横向排布；这些行为若自行实现，极易在 IME 与移动端输入法上出错。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pin-input\PinInput.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PinInputRootEmits, PinInputRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { PinInputRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<PinInputRootProps & { class?: any }>();
const emits = defineEmits<PinInputRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <PinInputRoot
    v-bind="forwarded"
    :class="cn('flex items-center gap-2', props.class)"
  >
    <slot></slot>
  </PinInputRoot>
</template>
