<!--
 * 数字输入框的容器：转发 radix NumberFieldRoot 的 props 与 emits（值、步进、格式化等）。
 *
 * 用 grid gap-1.5 统一内部间距，让「标签 + 输入区 + 提示」的纵向节奏与表单其它字段对齐；
 * 具体的增减按钮与输入框由子组件组合，本组件不限制内部排布。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\NumberField.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { NumberFieldRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<NumberFieldRootProps & { class?: any }>();
const emits = defineEmits<NumberFieldRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NumberFieldRoot v-bind="forwarded" :class="cn('grid gap-1.5', props.class)">
    <slot></slot>
  </NumberFieldRoot>
</template>
