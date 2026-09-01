<!--
 * 切换按钮组的容器：把 variant / size 通过 provide 下发给组内所有项。
 *
 * 走 provide 而不是逐个 prop 传递，是为了让调用方只在组上写一次尺寸与外观，
 * 组内项自动继承；个别项仍可用自己的 props 覆盖。
 * 单选与多选由 radix 的 type 决定，本组件不自行管理选中集合。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\toggle-group\ToggleGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority';
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'radix-vue';

import type { toggleVariants } from '../toggle';

import { computed, provide } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ToggleGroupRoot, useForwardPropsEmits } from 'radix-vue';

type ToggleGroupVariants = VariantProps<typeof toggleVariants>;

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<
  ToggleGroupRootProps & {
    class?: ClassValue;
    size?: ToggleGroupVariants['size'];
    variant?: ToggleGroupVariants['variant'];
  }
>();
const emits = defineEmits<ToggleGroupRootEmits>();

provide('toggleGroup', {
  size: props.size,
  variant: props.variant,
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    :class="cn('flex items-center justify-center gap-1', props.class)"
  >
    <slot></slot>
  </ToggleGroupRoot>
</template>
