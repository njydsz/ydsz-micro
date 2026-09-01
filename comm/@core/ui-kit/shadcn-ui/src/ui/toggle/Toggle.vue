<!--
 * 切换按钮：在 radix Toggle 之上套用 toggleVariants 的 variant / size 变体。
 *
 * size 与 variant 要从 props 中单独摘出再转发，
 * 否则这两个非 DOM 属性会被透传到原生按钮上，最终出现在 HTML 里成为无效属性；
 * 其余 props 原样转发给 radix，保留其开合语义与键盘行为。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\toggle\Toggle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ToggleEmits, ToggleProps } from 'radix-vue';

import type { ToggleVariants } from './toggle';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Toggle, useForwardPropsEmits } from 'radix-vue';

import { toggleVariants } from './toggle';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<
    ToggleProps & {
      class?: ClassValue;
      size?: ToggleVariants['size'];
      variant?: ToggleVariants['variant'];
    }
  >(),
  {
    disabled: false,
    size: 'default',
    variant: 'default',
  },
);

const emits = defineEmits<ToggleEmits>();

const delegatedProps = computed(() => {
  const { class: _, size: _size, variant: _variant, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <Toggle
    v-bind="forwarded"
    :class="cn(toggleVariants({ variant, size }), props.class)"
  >
    <slot></slot>
  </Toggle>
</template>
