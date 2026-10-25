<!--
 * 描述列表组件：以网格布局展示多个「标签 — 文本」字段对，
 * 用于详情页、审计记录等场景的结构化信息展示。
 *
 * 设计要点：
 * - 每个字段占一列，列内垂直排列标签与内容；整体为 column 列网格；
 * - 字段网格使用 auto-fill + minmax，在窄屏下自动换行；
 * - border 模式下使用统一边框与分割线，与 YdCard 配色保持一致；
 * - column / size / border 通过 provide 注入，子项自动共享布局配置。
 *
 * EP ElDescriptions / ElDescriptionsItem 契约对齐：
 * - column / border / size / title 属性语义不变；
 * - ElDescriptionsItem 的 span 属性映射到 CSS 网格跨度。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\descriptions\YdDescriptions.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, provide } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DESCRIPTIONS_BORDER,
  DESCRIPTIONS_COLUMN,
  DESCRIPTIONS_SIZE,
  type DescriptionsSize,
} from './constants';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<{
    class?: ClassValue;
    /** 每行展示的字段数，默认 3 */
    column?: number;
    /** 尺寸变体：default / small / large */
    size?: DescriptionsSize;
    /** 是否显示边框与分割线 */
    border?: boolean;
    /** 标题（可选） */
    title?: string;
  }>(),
  {
    border: false,
    column: 3,
    size: 'default',
  },
);

/** 网格模板：每列由标签和内容组成，span ≥ 1 时占据多个列 */
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.column}, minmax(0, 1fr))`,
  gap: '0',
}));

provide(DESCRIPTIONS_COLUMN, computed(() => props.column));
provide(DESCRIPTIONS_SIZE, computed(() => props.size));
provide(DESCRIPTIONS_BORDER, computed(() => props.border));
</script>

<template>
  <div :class="cn('rounded-lg', props.class)">
    <div
      v-if="title"
      class="px-4 py-2.5 font-medium text-sm border-b border-border-subtle"
    >
      {{ title }}
    </div>
    <div
      :class="cn(
        'grid',
        border && 'border border-border-subtle rounded-lg',
      )"
      :style="gridStyle"
    >
      <slot></slot>
    </div>
  </div>
</template>
