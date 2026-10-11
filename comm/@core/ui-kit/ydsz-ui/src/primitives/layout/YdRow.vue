<!--
 * 栅格行 —— 便利性封装（Convenience Wrapper）。
 *
 * 基于 CSS Grid 的 24 栅格系统，对齐 Element Plus ElRow 的 API 形态。
 * 内部调用 useGridProvider 向子 YdCol 暴露栅格上下文。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\layout\YdRow.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/**
 * 栅格行组件。
 * <p>基于 CSS Grid 的 24 栅格系统容器。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, provide } from 'vue';

import type { HTMLAttributes } from 'vue';

/** 断点类型（与 use-grid-layout 共享） */
export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/** 断点配置 */
export interface GridBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/** 栅格列配置 */
export interface GridColumnConfig {
  cols?: number | Partial<Record<GridBreakpoint, number>>;
  rowGap?: number | string;
  columnGap?: number | string;
}

/** 栅格上下文 */
export interface GridContext {
  computedCols: { value: number };
  currentBreakpoint: { value: GridBreakpoint };
  resolvedRowGap: string;
  resolvedColumnGap: string;
}

/** 注入 key */
export const GRID_CONTEXT_KEY: symbol = Symbol('ydsz-grid-context');

const props = withDefaults(defineProps<{
  /** 栅格间隙（像素）—— 同时设置横向和纵向 gutter */
  gutter?: number | number[];
  /** 水平间隙（像素） */
  xGutter?: number;
  /** 垂直间隙（像素） */
  yGutter?: number;
  /** 布局模式 */
  type?: 'flex' | 'grid';
  /** flex 模式下主轴对齐方式 */
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  /** flex 模式下交叉轴对齐方式 */
  align?: 'top' | 'middle' | 'bottom';
  /** 最大列数（默认 24） */
  cols?: number;
  /** 自定义 class */
  class?: HTMLAttributes['class'];
}>(), {
  type: 'grid',
  justify: 'start',
  align: 'top',
  cols: 24,
});

/**
 * 解析间距值——数字转 px 字符串，字符串直接返回
 */
function resolveGap(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/** 计算后的列间距（水平） */
const columnGap = computed((): string => {
  if (props.xGutter != null) return resolveGap(props.xGutter);
  if (props.gutter != null) {
    if (Array.isArray(props.gutter)) return resolveGap(props.gutter[0] ?? 0);
    return resolveGap(props.gutter);
  }
  return '0px';
});

/** 计算后的行间距（垂直） */
const rowGap = computed((): string => {
  if (props.yGutter != null) return resolveGap(props.yGutter);
  if (props.gutter != null) {
    if (Array.isArray(props.gutter)) return resolveGap(props.gutter[1] ?? 0);
    return resolveGap(props.gutter);
  }
  return '0px';
});

/** 计算样式 */
const rowStyle = computed((): Record<string, string> => {
  const style: Record<string, string> = {};

  if (props.type === 'grid') {
    style.display = 'grid';
    style.gridTemplateColumns = `repeat(${props.cols}, minmax(0, 1fr))`;
    style.gap = `${rowGap.value} ${columnGap.value}`;
  } else {
    // flex 模式
    style.display = 'flex';
    style.gap = `${rowGap.value} ${columnGap.value}`;
    style.justifyContent = props.justify === 'start' ? 'flex-start'
      : props.justify === 'end' ? 'flex-end'
        : props.justify === 'space-around' ? 'space-around'
          : props.justify === 'space-between' ? 'space-between'
            : 'center';
    style.alignItems = props.align === 'top' ? 'flex-start'
      : props.align === 'bottom' ? 'flex-end'
        : 'center';
  }

  return style;
});

// 提供栅格上下文给子组件（注：此处直接 provide 以避免循环依赖）
const gridContext: GridContext = {
  computedCols: { value: props.cols },
  currentBreakpoint: { value: 'md' },
  resolvedRowGap: rowGap.value,
  resolvedColumnGap: columnGap.value,
};

provide(GRID_CONTEXT_KEY, gridContext);
</script>

<template>
  <!--
    栅格行组件 —— 24 栅格布局容器。

    API 对齐 Element Plus ElRow：
    - gutter: 栅格间距（支持 [水平, 垂直] 数组格式）
    - type: 'flex' | 'grid'（默认 'grid'）
    - justify: flex 模式下主轴对齐
    - align: flex 模式下交叉轴对齐

    示例：
    ```html
    <YdRow :gutter="16">
      <YdCol :span="6"><YdCard>Col-6</YdCard></YdCol>
      <YdCol :span="6"><YdCard>Col-6</YdCard></YdCol>
      <YdCol :span="6"><YdCard>Col-6</YdCard></YdCol>
      <YdCol :span="6"><YdCard>Col-6</YdCard></YdCol>
    </YdRow>

    <!-- 响应式布局 -->
    <YdRow :gutter="[16, 24]">
      <YdCol :span="8" :md="12" :xs="24"><YdCard>响应式列</YdCol>
    </YdRow>
    ```
  -->
  <div
    :style="rowStyle"
    :class="props.class"
  >
    <slot />
  </div>
</template>
