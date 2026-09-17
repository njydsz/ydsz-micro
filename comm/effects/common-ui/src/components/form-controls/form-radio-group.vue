<!--
 * 表单单选组：options 数组驱动的单选控件（ElRadioGroup 等价物）。
 *
 * 值语义对齐 ElRadioGroup：modelValue 为选中项的 value（字符串，
 * radix YdRadioGroupItem 仅接受字符串值，数字 value 需在 schema 侧转字符串）。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-radio-group.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdRadioGroup, YdRadioGroupItem } from '@ydsz-core/shadcn-ui';

interface RadioGroupOption {
  disabled?: boolean;
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    disabled?: boolean;
    options?: RadioGroupOption[];
  }>(),
  {
    disabled: false,
    options: () => [],
  },
);

const model = defineModel<string>();
</script>

<template>
  <YdRadioGroup
    v-model="model"
    :class="'flex flex-wrap items-center gap-x-4 gap-y-2'"
    :disabled="disabled"
  >
    <label
      v-for="option in options"
      :key="option.value"
      :class="option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
      class="flex items-center gap-2 text-sm"
    >
      <YdRadioGroupItem :disabled="option.disabled" :value="option.value" />
      <span>{{ option.label }}</span>
    </label>
  </YdRadioGroup>
</template>
