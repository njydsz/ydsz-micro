<!--
 * 切换按钮组中的一项：从 toggleGroup 上下文取 variant / size，自身 props 优先。
 *
 * 变体取值先从 inject 的上下文中取、再与本地 props 合并，
 * 这样既支持整组统一样式，也允许单独强调某一项；
 * 注入缺失时降级为 undefined，由 cva 的 defaultVariants 兜底，不会报错。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\toggle-group\ToggleGroupItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority';
import type { ToggleGroupItemProps } from 'radix-vue';

import { computed, inject } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ToggleGroupItem, useForwardProps } from 'radix-vue';

import { toggleVariants } from '../toggle';

type ToggleGroupVariants = VariantProps<typeof toggleVariants>;

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<
  ToggleGroupItemProps & {
    class?: ClassValue;
    size?: ToggleGroupVariants['size'];
    variant?: ToggleGroupVariants['variant'];
  }
>();

const context = inject<ToggleGroupVariants>('toggleGroup');

const delegatedProps = computed(() => {
  const { class: _, size: _size, variant: _variant, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        toggleVariants({
          variant: context?.variant || variant,
          size: context?.size || size,
        }),
        props.class,
      )
    "
  >
    <slot></slot>
  </ToggleGroupItem>
</template>
