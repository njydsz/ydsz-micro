<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Minus, Plus } from 'lucide-vue-next';

import {
  inputNumberVariants,
  inputNumberInputVariants,
  inputNumberBtnVariants,
  type InputNumberSize,
} from './input-number';

interface Props {
  class?: any;
  disabled?: boolean;
  /** 小数精度 */
  precision?: number;
  /** 最大值 */
  max?: number;
  /** 最小值 */
  min?: number;
  /** 占位符 */
  placeholder?: string;
  /** 只读 */
  isReadonly?: boolean;
  /** 单步增减值 */
  step?: number;
  /** 尺寸 */
  size?: InputNumberSize;
  /** 受控值 */
  modelValue?: number;
  /** 变化回调 */
  change?: (val: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  max: Number.MAX_SAFE_INTEGER,
  min: Number.MIN_SAFE_INTEGER,
  precision: undefined,
  isReadonly: false,
  step: 1,
  size: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [val: number | undefined];
}>();

const displayValue = computed({
  get: () =>
    props.modelValue !== undefined && props.modelValue !== null
      ? props.precision !== undefined
        ? props.modelValue.toFixed(props.precision)
        : String(props.modelValue)
      : '',
  set: (raw: string) => {
    const num = Number.parseFloat(raw);
    if (Number.isNaN(num)) {
      emit('update:modelValue', undefined);
      return;
    }
    emit('update:modelValue', clampAndPrecision(num));
  },
});

function clampAndPrecision(val: number): number {
  let v = Math.min(props.max, Math.max(props.min, val));
  if (props.precision !== undefined) {
    const factor = Math.pow(10, props.precision);
    v = Math.round(v * factor) / factor;
  }
  return v;
}

function stepUp(): void {
  if (props.disabled || props.isReadonly) return;
  const cur = props.modelValue ?? 0;
  const next = clampAndPrecision(cur + props.step);
  emit('update:modelValue', next);
  props.change?.(next);
}

function stepDown(): void {
  if (props.disabled || props.isReadonly) return;
  const cur = props.modelValue ?? 0;
  const next = clampAndPrecision(cur - props.step);
  emit('update:modelValue', next);
  props.change?.(next);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    stepUp();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    stepDown();
  }
}

const btnClass = computed(() =>
  cn(
    inputNumberBtnVariants({ size: props.size }),
    props.disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted',
  ),
);
</script>

<template>
  <div :class="cn(inputNumberVariants({ size }), props.class)">
    <button
      :aria-label="'减少'"
      :class="cn(btnClass, 'rounded-l-md border-r-0')"
      :disabled="props.disabled || (props.modelValue ?? props.min) <= props.min"
      type="button"
      @click="stepDown"
    >
      <Minus class="size-3.5" />
    </button>
    <input
      v-model="displayValue"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :readonly="props.isReadonly"
      :class="inputNumberInputVariants({ size })"
      inputmode="decimal"
      type="text"
      @keydown="handleKeydown"
      @blur="emit('update:modelValue', modelValue !== undefined ? Number(displayValue) || 0 : undefined)"
    />
    <button
      :aria-label="'增加'"
      :class="cn(btnClass, 'rounded-r-md border-l-0')"
      :disabled="props.disabled || (props.modelValue ?? props.max) >= props.max"
      type="button"
      @click="stepUp"
    >
      <Plus class="size-3.5" />
    </button>
  </div>
</template>
