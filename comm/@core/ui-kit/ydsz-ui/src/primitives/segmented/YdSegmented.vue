<!--
 * Segmented 分段控制器：在多个互斥选项间切换。
 *
 * 与 Tabs 的区别：Segmented 是更紧凑的按钮组样式，常用于视图切换（列表 / 卡片 / 地图）
 * 或筛选状态切换。不支持	router 集成。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\segmented\YdSegmented.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

export interface SegmentedOption {
  /** 禁用 */
  disabled?: boolean;
  /** 选项值 */
  value: string | number;
  /** 显示标签 */
  label: string;
  /** 图标（lucide 组件） */
  icon?: any;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否块级显示（占满容器宽度） */
  block?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选项列表 */
  options: SegmentedOption[];
  /** 尺寸 */
  size?: 'default' | 'large' | 'small';
  /** 选中值（受控） */
  modelValue?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  block: false,
  disabled: false,
  modelValue: undefined,
  options: () => [],
  size: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
}>();

const sizeClass: Record<string, string> = {
  large: 'px-5 py-2 text-base',
  default: 'px-4 py-1.5 text-sm',
  small: 'px-3 py-1 text-xs',
};

function handleSelect(value: string | number): void {
  emit('update:modelValue', value);
  emit('change', value);
}

/** 当前选中索引（用于滑块定位） */
const activeIndex = computed(() =>
  props.options.findIndex((o) => o.value === props.modelValue),
);

/** 选中指示器 left/size 内联样式 */
const sliderStyle = computed(() => {
  if (activeIndex.value < 0) return { opacity: '0' };
  const total = props.options.length;
  return {
    left: `${(activeIndex.value / total) * 100}%`,
    opacity: '1',
    width: `${100 / total}%`,
  };
});
</script>

<template>
  <div
    :class="
      cn(
        'relative inline-flex items-center rounded-lg bg-muted/60 p-1 transition-colors',
        props.block && 'flex w-full',
        props.disabled && 'pointer-events-none opacity-50',
        props.class,
      )
    "
    role="tablist"
  >
    <!-- 选中指示器滑块 -->
    <span
      :aria-hidden="true"
      class="absolute top-1 bottom-1 rounded-md bg-background shadow-sm transition-all duration-200 ease-spring"
      :style="sliderStyle"
    ></span>

    <!-- 选项列表 -->
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      :aria-selected="opt.value === modelValue"
      :aria-disabled="opt.disabled"
      :class="
        cn(
          'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150',
          sizeClass[props.size],
          props.block && 'flex-1',
          opt.value === modelValue
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
          opt.disabled && 'cursor-not-allowed opacity-40',
        )
      "
      :disabled="opt.disabled"
      role="tab"
      type="button"
      @click="!opt.disabled && handleSelect(opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="size-4" />
      {{ opt.label }}
    </button>
  </div>
</template>
