<!--
 * 验证码输入的分格容器：把 PinInputInput 组织成一组。
 *
 * 基于 Primitive 而非固定 div，是为了在需要给整组加语义（如 role=group）
 * 或用 asChild 换成 fieldset 时不必改组件。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pin-input\PinInputGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Primitive, useForwardProps } from 'radix-vue';

const props = defineProps<PrimitiveProps & { class?: any }>();
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <Primitive
    v-bind="forwardedProps"
    :class="cn('flex items-center', props.class)"
  >
    <slot></slot>
  </Primitive>
</template>
