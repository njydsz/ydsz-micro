<!--
 * Rate 评分：用于对事物进行分级展示。
 *
 * 受控组件：modelValue 为当前分值（0 ~ count）。
 * 支持半星（allowHalf）与只读（readonly）模式。
 * 无障碍：渲染为 role="radiogroup" 的单选组，支持键盘箭头左右调整。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\rate\YdRate.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Star } from 'lucide-vue-next';

interface Props {
  /** 是否允许半星 */
  allowHalf?: boolean;
  /** 自定义类名 */
  class?: any;
  /** 自定义字符（替代默认星形） */
  character?: string;
  /** 星星总数 */
  count?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 分值（受控） */
  modelValue?: number;
  /** 只读 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allowHalf: false,
  count: 5,
  disabled: false,
  modelValue: 0,
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  hover: [value: number];
}>();

/** 每个星星的填充百分比（用于实现半星渲染） */
const starFillPercentages = computed(() => {
  const value = props.modelValue ?? 0;
  return Array.from({ length: props.count }, (_, i) => {
    const starIndex = i + 1;
    if (value >= starIndex) return 100;
    if (value >= starIndex - 0.5) return 50;
    return 0;
  });
});

function handleClick(index: number): void {
  if (props.readonly || props.disabled) return;
  const nextValue = props.allowHalf && index === Math.ceil(props.modelValue)
    ? index - 0.5
    : index;
  emit('update:modelValue', nextValue === props.modelValue ? 0 : nextValue);
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  if (props.readonly || props.disabled) return;
  const step = props.allowHalf ? 0.5 : 1;
  let next = props.modelValue;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    next = Math.min(props.count, next + step);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    next = Math.max(0, next - step);
  } else if (event.key === 'Enter' || event.key === ' ') {
    next = index;
  } else {
    return;
  }
  event.preventDefault();
  emit('update:modelValue', next);
}
</script>

<template>
  <div
    :class="cn('inline-flex gap-0.5', props.class)"
    :aria-disabled="props.disabled"
    :aria-readonly="props.readonly"
    :aria-label="`评分 ${props.modelValue} / ${props.count}`"
    role="radiogroup"
    tabindex="0"
  >
    <button
      v-for="(_, i) in count"
      :key="i"
      :aria-checked="modelValue >= i + 1"
      :aria-label="`${i + 1} 星`"
      :class="
        cn(
          'relative',
          props.disabled || props.readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110',
        )
      "
      :disabled="props.disabled || props.readonly"
      role="radio"
      type="button"
      @click="handleClick(i + 1)"
      @keydown="handleKeydown($event, i + 1)"
    >
      <!-- 背景空星 -->
      <Star
        class="text-rate-empty"
        :class="cn(props.character ? '' : 'size-6')"
        fill="currentColor"
      />
      <!-- 前景填充星（clipped） -->
      <span
        class="absolute inset-0 overflow-hidden"
        :style="{ width: `${starFillPercentages[i]}%` }"
      >
        <Star class="text-rate-filled" fill="currentColor" />
      </span>
    </button>
  </div>
</template>
