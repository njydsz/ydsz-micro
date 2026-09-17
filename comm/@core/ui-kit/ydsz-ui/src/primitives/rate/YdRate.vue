<!--
 * Rate 评分：通过点击星星进行评级。
 *
 * 受控组件：modelValue 为当前分值（0 ~ count）。
 * 支持半星模式（allowHalf）与只读模式（readonly）。
 * 无障碍：role="radiogroup" + role="radio"，支持键盘箭头调整分值。
 *
 * 星星填充通过两层层叠实现：底层空星 + 上层按 percentage 宽度裁剪的填充星。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\rate\YdRate.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Star } from 'lucide-vue-next';

interface Props {
  /** 是否允许半星 */
  allowHalf?: boolean;
  /** 自定义类名 */
  class?: any;
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
}>();

/** 每个星星的填充百分比 */
const starFillPercentages = computed(() => {
  const value = props.modelValue ?? 0;
  return Array.from({ length: props.count }, (_, i) => {
    const starIndex = i + 1;
    if (value >= starIndex) return 100;
    if (props.allowHalf && value >= starIndex - 0.5) return 50;
    return 0;
  });
});

function handleClick(index: number): void {
  if (props.readonly || props.disabled) return;
  const nextValue = props.allowHalf && index === Math.ceil(props.modelValue ?? 0)
    ? index - 0.5
    : index;
  emit('update:modelValue', nextValue === props.modelValue ? 0 : nextValue);
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  if (props.readonly || props.disabled) return;
  const step = props.allowHalf ? 0.5 : 1;
  let next = props.modelValue ?? 0;
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
      :aria-checked="modelValue !== undefined && modelValue >= i + 1"
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
      <Star class="size-6 fill-neutral-300 text-neutral-300 dark:fill-neutral-600 dark:text-neutral-600" />
      <!-- 前景填充星（宽度裁剪实现百分比） -->
      <span class="absolute inset-0 overflow-hidden" :style="{ width: `${starFillPercentages[i]}%` }">
        <Star class="size-6 fill-yellow-400 text-yellow-400" />
      </span>
    </button>
  </div>
</template>
