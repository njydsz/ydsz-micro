<!--
 * YdInput Vue 组件 —— 现代化输入框，对标一线竞品（EP Input / Naive Input）能力矩阵。
 *
 * <p>增强能力（对标 element-plus / naive-ui / ant-design-vue）：
 * <ul>
 *   <li>clearable：带清空按钮</li>
 *   <li>prefix / suffix：前后置标签或图标（slot + prop 双入口）</li>
 *   <li>showCount + maxlength：字符计数</li>
 *   <li>disabled / readonly：禁用与只读状态</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\YdInput.vue
 * @author ydsz-team
 * @since 1.0.0 (5.6.0 新增 clearable/prefix/suffix/showCount)
-->
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useVModel } from '@vueuse/core';

/** 输入框尺寸档位 */
export type InputSize = 'xs' | 'sm' | 'default' | 'lg';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 默认值 */
  defaultValue?: number | string;
  /** 输入框尺寸 */
  size?: InputSize;
  /** 受控值 */
  modelValue?: number | string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否显示清空按钮（输入框有内容时显示） */
  isClearable?: boolean;
  /** 是否显示字符计数（需配合 maxlength） */
  isShowCount?: boolean;
  /** 最大输入长度 */
  maxlength?: number;
  /** 前置内容（prop 形式，slot 优先） */
  prefix?: string;
  /** 后置内容（prop 形式，slot 优先） */
  suffix?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 输入框类型，默认 'text' */
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isClearable: false,
  isShowCount: false,
  size: 'default',
  type: 'text',
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: number | string): void;
  (e: 'clear'): void;
}>();

const slots = useSlots();
const isFocused = ref(false);

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
});

const hasContent = computed(() => {
  return modelValue.value != null && String(modelValue.value).length > 0;
});

const showClearBtn = computed(() => {
  return props.isClearable && hasContent.value;
});

/** 是否使用了 prefix/suffix slot 或 prop */
const hasPrefix = computed(() => {
  return !!slots.prefix || !!props.prefix;
});

const hasSuffix = computed(() => {
  return !!slots.suffix || !!props.suffix || showClearBtn.value || props.isShowCount;
});

/** 外层包裹容器是否启用（有 prefix/suffix 时启用 relative 包裹） */
const isWrapped = computed(() => {
  return hasPrefix.value || hasSuffix.value;
});

/** 字符计数文本 */
const countText = computed(() => {
  if (!props.isShowCount) return '';
  const current = String(modelValue.value ?? '').length;
  if (props.maxlength != null) {
    return `${current} / ${props.maxlength}`;
  }
  return `${current}`;
});

/** 清除输入 */
function handleClear(): void {
  modelValue.value = '';
  emits('clear');
}

/** 尺寸类名映射 */
const sizeClasses: Record<InputSize, string> = {
  default: 'h-10 px-3 py-2 text-sm',
  lg: 'h-11 px-4 py-2.5 text-base',
  sm: 'h-8 px-2.5 py-1.5 text-xs',
  xs: 'h-7 px-2 py-1 text-xs',
};

/** 前置/后置内容的尺寸适配 */
const affixSizeClasses: Record<InputSize, string> = {
  default: 'px-3 text-sm',
  lg: 'px-4 text-base',
  sm: 'px-2.5 text-xs',
  xs: 'px-2 text-xs',
};
</script>

<template>
  <!-- 有 prefix/suffix 时使用包裹容器 -->
  <div v-if="isWrapped" class="relative flex w-full items-center">
    <!-- 前置内容 -->
    <span
      v-if="hasPrefix"
      class="border-input bg-muted text-muted-foreground inline-flex items-center border border-r-0 rounded-l-md"
      :class="affixSizeClasses[props.size ?? 'default']"
    >
      <slot name="prefix">{{ props.prefix }}</slot>
    </span>

    <!-- 输入框本体 -->
    <input
      v-model="modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :maxlength="props.maxlength"
      :class="
        cn(
          'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-input-background transition-all',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'hover:border-border-strong',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'readonly:cursor-default readonly:bg-muted/30',
          sizeClasses[props.size ?? 'default'],
          // 有 prefix 时去除左圆角，有 suffix 时去除右圆角
          hasPrefix && 'rounded-l-none border-l-0',
          hasSuffix && 'rounded-r-none border-r-0',
          props.class,
        )
      "
      :aria-disabled="props.disabled"
      :aria-readonly="props.readonly"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <!-- 后置内容区域（suffix 计数 + 清空按钮）-->
    <span
      v-if="hasSuffix"
      class="border-input bg-muted text-muted-foreground inline-flex items-center gap-1 border border-l-0 rounded-r-md"
      :class="affixSizeClasses[props.size ?? 'default']"
    >
      <!-- 清空按钮 -->
      <button
        v-if="showClearBtn"
        type="button"
        class="text-muted-foreground/60 hover:text-foreground rounded-full p-0.5 transition-colors"
        aria-label="清空输入"
        tabindex="-1"
        @click="handleClear"
      >
        <svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </button>

      <!-- 字符计数 -->
      <span
        v-if="props.isShowCount"
        :class="cn('tabular-nums', props.maxlength != null && countText.includes('/') && Number(countText.split(' ')[0]) >= props.maxlength && 'text-destructive')"
      >
        {{ countText }}
      </span>

      <!-- 后置内容插槽 -->
      <slot name="suffix">{{ props.suffix }}</slot>
    </span>
  </div>

  <!-- 无 prefix/suffix 时直接渲染输入框，避免 DOM 嵌套 -->
  <input
    v-else
    v-model="modelValue"
    :type="props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :maxlength="props.maxlength"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-input-background transition-all',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'readonly:cursor-default readonly:bg-muted/30',
        sizeClasses[props.size ?? 'default'],
        props.class,
      )
    "
    :aria-disabled="props.disabled"
    :aria-readonly="props.readonly"
    @focus="isFocused = true"
    @blur="isFocused = false"
  />
</template>
