<!--
 * 描述列表字段项：承载「标签 — 文本」一对信息，由 YdDescriptions 容器编排网格位置。
 *
 * 与 EP ElDescriptionsItem 的契约对齐：
 * - label 属性渲染在标签列（左侧或上方，由 size / 方向决定）；
 * - span ≥ 1 时横向跨越多个列；
 * - 内容区默认为 default slot，标签区通过具名 label slot 自定义。
 *
 * 注入依赖：从父级 YdDescriptions 获取 column / size / border 配置，
 * 不直接使用 props 传递，避免逐项透传。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\descriptions\YdDescriptionsItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, inject } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DESCRIPTIONS_BORDER,
  DESCRIPTIONS_COLUMN,
  DESCRIPTIONS_SIZE,
} from './constants';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<{
    class?: ClassValue;
    /** 标签文本 */
    label?: string;
    /** 横向跨越列数，默认 1 */
    span?: number;
    /** 标签列自定义类名 */
    labelClass?: ClassValue;
    /** 内容列自定义类名 */
    contentClass?: ClassValue;
  }>(),
  {
    span: 1,
  },
);

const parentColumn = inject(DESCRIPTIONS_COLUMN, computed(() => 3));
const parentSize = inject(DESCRIPTIONS_SIZE, computed(() => 'default' as const));
const parentBorder = inject(DESCRIPTIONS_BORDER, computed(() => false));

/** 网格列跨度：span 不能超过父级总列数 */
const gridColumn = computed(
  () => `span ${Math.min(props.span, parentColumn.value)} / span ${Math.min(props.span, parentColumn.value)}`,
);

/** 尺寸 → 单元格 padding map */
const sizePadding: Record<string, string> = {
  small: 'px-3 py-1.5',
  default: 'px-4 py-2',
  large: 'px-5 py-3',
};

/** 标签与内容区域公共 padding */
const cellPadding = computed(() => sizePadding[parentValue(parentSize)] ?? sizePadding.default);

function parentValue<T>(ref: { value: T }): T {
  return ref.value;
}
</script>

<template>
  <div
    :class="cn(
      'flex flex-col',
      parentBorder && 'border-t border-border-subtle',
      props.class,
    )"
    :style="{ gridColumn }"
  >
    <div
      :class="cn(
        cellPadding,
        'text-sm font-medium text-text-secondary',
        'bg-surface-2/50',
        props.labelClass,
      )"
    >
      <slot name="label">{{ label }}</slot>
    </div>
    <div
      :class="cn(
        cellPadding,
        'text-sm text-text-primary break-words',
        props.contentClass,
      )"
    >
      <slot></slot>
    </div>
  </div>
</template>
