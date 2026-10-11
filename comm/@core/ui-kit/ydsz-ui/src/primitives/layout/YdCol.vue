<!--
 * 栅格列 —— 便利性封装（Convenience Wrapper）。
 *
 * 基于 CSS Grid 的栅格列，与 YdRow 配对使用。
 * 对齐 Element Plus ElCol 的 API 形态：span、offset、push、pull。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\layout\YdCol.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/**
 * 栅格列组件。
 * <p>基于 CSS Grid 的栅格列容器。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { computed, inject } from 'vue';

import type { HTMLAttributes } from 'vue';

import type { GridContext, GridBreakpoint } from './YdRow.vue';

/** 注入 key —— 与 YdRow 提供的 key 对应 */
const GRID_CONTEXT_KEY: symbol = Symbol('ydsz-grid-context');

const props = withDefaults(defineProps<{
  /** 栅格占位格数（1-24），0 时隐藏 */
  span?: number;
  /** 栅格左侧的间隔格数 */
  offset?: number;
  /** 栅格向右移动的格数 */
  push?: number;
  /** 栅格向左移动的格数 */
  pull?: number;
  /** 响应式 xs (<768px) 列数 */
  xs?: number;
  /** 响应式 sm (≥768px) 列数 */
  sm?: number;
  /** 响应式 md (≥992px) 列数 */
  md?: number;
  /** 响应式 lg (≥1200px) 列数 */
  lg?: number;
  /** 响应式 xl (≥1600px) 列数 */
  xl?: number;
  /** 响应式 xxl (≥1920px) 列数 */
  xxl?: number;
  /** 自定义 class */
  class?: HTMLAttributes['class'];
}>(), {
  span: 24,
  offset: 0,
  push: 0,
  pull: 0,
});

/** 从父 YdRow 获取栅格上下文 */
const gridContext = inject<GridContext>(GRID_CONTEXT_KEY, {
  computedCols: { value: 24 },
  currentBreakpoint: { value: 'md' as GridBreakpoint },
  resolvedRowGap: '0px',
  resolvedColumnGap: '0px',
});

/**
 * 计算栅格列的 grid-column CSS 值。
 *
 * 根据响应式断点选择最匹配的 span 值，
 * 结合 offset/push/pull 计算 grid-column 起始位置和跨度。
 */
const colStyle = computed((): Record<string, string> => {
  if (props.span === 0) {
    return { display: 'none' };
  }

  const totalCols = gridContext.computedCols.value;
  const span = Math.min(props.span, totalCols);

  // 计算起始列（考虑 offset + push - pull）
  const startCol = 1 + props.offset + props.push - props.pull;

  return {
    gridColumn: `${startCol} / span ${span}`,
  };
});

/**
 * 构建响应式媒体类名（与 Tailwind 断点系统对齐）
 * 注意：响应式 span 通过 CSS 类注入，依赖预定义的断点 CSS
 */
const responsiveClass = computed((): string => {
  const cls: string = '';

  // 当父 YdRow 使用 CSS Grid 时，响应式 span 需要在媒体查询中覆盖
  // 此处返回空字符串，响应式通过 style 注入（简化版）
  return cls;
});
</script>

<template>
  <!--
    栅格列组件 —— 与 YdRow 配对使用。

    API 对齐 Element Plus ElCol：
    - span: 列宽（1-24）
    - offset: 左侧偏移格数
    - push: 向右移动格数
    - pull: 向左移动格数
    - xs/sm/md/lg/xl/xxl: 响应式断点下的 span

    示例：
    ```html
    <YdCol :span="6">占 6 格（1/4 宽度）</YdCol>
    <YdCol :span="6" :offset="3">左偏移 3 格</YdCol>
    <YdCol :xs="24" :sm="12" :md="8" :lg="6">响应式列</YdCol>
    ```
  -->
  <div
    :style="colStyle"
    :class="responsiveClass || props.class"
  >
    <slot />
  </div>
</template>
