/*
 * 通用多选网格组件（用于 CronBuilder 中的分钟/小时/月/周几选择）
 *
 * @path apps\cronjob-web\src\components\cron-builder\CronMultiSelect.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script lang="ts" setup name="CronMultiSelect">
import { YdCheckbox, YdLabel } from '@ydsz-core/ydsz-ui';

interface OptionItem {
  label: string;
  value: number;
}

const props = withDefaults(
  defineProps<{
    options?: OptionItem[];
    modelValue?: number[];
    disabled?: boolean;
  }>(),
  {
    options: () => [],
    modelValue: () => [],
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

function toggle(val: number, checked: boolean): void {
  if (checked) {
    emit('update:modelValue', [...(props.modelValue ?? []), val]);
  } else {
    emit('update:modelValue', (props.modelValue ?? []).filter((v) => v !== val));
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <template v-for="opt in props.options" :key="opt.value">
      <div class="flex items-center">
        <YdCheckbox
          :checked="(props.modelValue ?? []).includes(opt.value)"
          :disabled="props.disabled"
          @update:checked="(checked: boolean) => toggle(opt.value, checked)"
        />
        <YdLabel class="ml-1 text-xs">{{ opt.label }}</YdLabel>
      </div>
    </template>
  </div>
</template>
