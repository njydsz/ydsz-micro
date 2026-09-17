<!--
 * 表单复选框组：options 数组驱动的多选控件（ElCheckboxGroup 等价物）。
 *
 * 值语义与 ElCheckboxGroup 对齐：modelValue 为选中 value 的数组；
 * options 为 { label, value, disabled? } 列表。整体禁用优先于单项禁用。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-checkbox-group.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdCheckboxBase } from '@ydsz-core/shadcn-ui';

interface CheckboxGroupOption {
  disabled?: boolean;
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    options?: CheckboxGroupOption[];
  }>(),
  {
    disabled: false,
    options: () => [],
  },
);

const model = defineModel<Array<string>>();

/**
 * 判断选项是否已选中。
 *
 * @param value 选项值
 * @returns 是否选中
 */
function isChecked(value: string): boolean {
  return model.value?.includes(value) ?? false;
}

/**
 * 切换选项选中态；整体禁用或单项禁用时静默返回。
 *
 * @param option 被点击的选项
 */
function toggle(option: CheckboxGroupOption): void {
  if (props.disabled || option.disabled) return;
  const current = [...(model.value ?? [])];
  const index = current.indexOf(option.value);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(option.value);
  }
  model.value = current;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2" role="group">
    <label
      v-for="option in props.options"
      :key="option.value"
      :class="
        props.disabled || option.disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'
      "
      class="flex items-center gap-2 text-sm"
      @click.prevent="toggle(option)"
    >
      <YdCheckboxBase
        :aria-hidden="true"
        :checked="isChecked(option.value)"
        :disabled="props.disabled || option.disabled"
        tabindex="-1"
      />
      <span>{{ option.label }}</span>
    </label>
  </div>
</template>
