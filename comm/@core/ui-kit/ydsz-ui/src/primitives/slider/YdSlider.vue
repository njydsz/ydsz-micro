<!--
 * Slider 滑块：在数值区间内拖拽选择。
 *
 * 基于 Radix Slider 封装双值 range 模式；
 * 竖直模式下轨道宽度通过 css 变量控制。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\slider\YdSlider.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'radix-vue';

interface Props extends SliderRootProps {
  /** 自定义类名 */
  class?: any;
  /** 双值模式 */
  range?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  range: false,
});

const emit = defineEmits<SliderRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, range: _range, ...delegated } = props;
  return delegated;
});

const thumbs = computed(() => {
  return (props.defaultValue ?? props.modelValue ?? [0]) as number[];
});
</script>

<template>
  <SliderRoot
    v-bind="delegatedProps"
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center',
        props.orientation === 'vertical' ? 'h-full w-5 flex-col' : 'h-5',
        props.class,
      )
    "
    @update:model-value="(v) => emit('update:modelValue', v)"
    @value-commit="(v) => emit('valueCommit', v)"
  >
    <SliderTrack
      class="bg-slider-track relative h-1.5 w-full grow overflow-hidden rounded-full dark:bg-neutral-700"
    >
      <SliderRange
        class="bg-slider-range absolute h-full rounded-full dark:bg-brand-400"
        :class="cn(props.range ?? false ? '' : '', '')"
      />
    </SliderTrack>
    <SliderThumb
      v-for="(_, i) in thumbs"
      :key="i"
      class="ring-slider-thumb-ring block size-4 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
      :aria-label="'滑块值'"
    />
  </SliderRoot>
</template>
