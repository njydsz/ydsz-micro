<!--
 * 表单数字输入：组合 radix YdNumberField 的单组件形态（ElInputNumber 等价物）。
 *
 * YdNumberField 原子件是 Root/YdInput/Increment/Decrement 四件套组合，
 * 表单注册表需要单组件形态；此处组装 Root + YdInput，min/max/step/placeholder
 * 由 schema 直接下发，其余 attrs 透传。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-input-number.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdNumberField, YdNumberFieldInput } from '@ydsz-core/shadcn-ui';

withDefaults(
  defineProps<{
    disabled?: boolean;
    max?: number;
    min?: number;
    placeholder?: string;
    step?: number;
  }>(),
  {
    disabled: false,
    step: 1,
  },
);

const model = defineModel<number | null>();
</script>

<template>
  <YdNumberField
    v-model="model"
    :disabled="disabled"
    :max="max"
    :min="min"
    :step="step"
  >
    <YdNumberFieldInput :placeholder="placeholder" />
  </YdNumberField>
</template>
