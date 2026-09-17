/**
 * useGridLayout Composable —— 响应式网格布局状态机。
 *
 * 设计目标：
 *  - 提供基于 CSS Grid 的响应式栅格系统（列数、间距、断点）；
 *  - 通过注入 consumption 模式让 GridItem 自动依据容器宽度计算跨列；
 *  - 内置断点系统（xs/sm/md/lg/xl/xxl）对齐主流设计体系。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-grid-layout.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { InjectionKey, Ref } from 'vue';

import { inject, provide, readonly, ref } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 断点名称 */
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

/** 默认断点 */
export const DEFAULT_BREAKPOINTS: GridBreakpoints = {
  lg: 1200,
  md: 992,
  sm: 768,
  xl: 1600,
  xs: 0,
  xxl: 1920,
};

/** 栅格列配置 */
export interface GridColumnConfig {
  /** 列数（1-24） */
  cols?: number | Partial<Record<GridBreakpoint, number>>;
  /** 行间距（px 或 css 字符串） */
  rowGap?: number | string;
  /** 列间距（px 或 css 字符串） */
  columnGap?: number | string;
}

/** 栅格项配置 */
export interface GridItemConfig {
  /** 跨列数 */
  span?: number | Partial<Record<GridBreakpoint, number>>;
  /** 偏移列数 */
  offset?: number;
  /** 排序顺序 */
  order?: number;
}

/** 栅格上下文 */
export interface GridContext {
  /** 当前断点 */
  currentBreakpoint: Ref<GridBreakpoint>;
  /** 计算后的列数 */
  computedCols: Ref<number>;
  /** 实际行间距 */
  resolvedRowGap: string;
  /** 实际列间距 */
  resolvedColumnGap: string;
}

/** 注入 key */
export const GRID_CONTEXT_KEY: InjectionKey<GridContext> = Symbol('ydsz-grid-context');

/* ============================================================ */
/* useGridContext (inject)                                       */
/* ============================================================ */

/**
 * 在子组件中获取栅格上下文。
 *
 * @returns 当前栅格上下文
 */
export function useGridContext(): GridContext {
  const ctx = inject(GRID_CONTEXT_KEY, null);
  if (!ctx) {
    // 父级未提供 GridProvider 时回退默认上下文
    const fallbackCols = ref(12);
    return {
      computedCols: fallbackCols,
      currentBreakpoint: ref('md'),
      resolvedColumnGap: '1rem',
      resolvedRowGap: '1rem',
    };
  }
  return ctx;
}

/* ============================================================ */
/* useGridProvider (provide)                                     */
/* ============================================================ */

/**
 * 栅格参数。
 */
export interface UseGridProviderOptions {
  /** 列配置 */
  columns?: GridColumnConfig['cols'];
  /** 行间距 */
  rowGap?: number | string;
  /** 列间距 */
  columnGap?: number | string;
  /** 自定义断点 */
  breakpoints?: Partial<GridBreakpoints>;
}

/**
 * useGridProvider —— 在栅格容器中调用，向子 GridItem 暴露上下文。
 *
 * @param options - 栅格配置
 * @returns 栅格上下文（可响应断点变化）
 */
export function useGridProvider(
  options: UseGridProviderOptions = {},
): GridContext {
  const { columns = 12, rowGap = 16, columnGap = 16 } = options;

  const currentBreakpoint = ref<GridBreakpoint>('md');

  /** 根据列配置计算初始列数 */
  const initialCols = typeof columns === 'number'
    ? columns
    : (columns?.md ?? 12);
  const computedCols = ref(initialCols);

  // 处理间距为字符串或数字
  function resolveGap(value: number | string): string {
    return typeof value === 'number' ? `${value}px` : value;
  }

  const resolvedRowGap = resolveGap(rowGap);
  const resolvedColumnGap = resolveGap(columnGap);

  const ctx: GridContext = {
    computedCols,
    currentBreakpoint: readonly(currentBreakpoint),
    resolvedColumnGap,
    resolvedRowGap,
  };

  provide(GRID_CONTEXT_KEY, ctx);

  return ctx;
}

/* ============================================================ */
/* useGridItem                                                   */
/* ============================================================ */

/**
 * useGridItem —— 计算栅格项的跨列样式。
 *
 * @param config - 栅格项配置
 * @returns 行内样式对象
 */
export function useGridItem(config: GridItemConfig = {}): {
  gridColumn: string;
  order: number;
} {
  const ctx = useGridContext();
  const span = typeof config.span === 'number' ? config.span : (config.span?.md ?? 1);
  const offset = config.offset ?? 0;
  const spanValue = Math.min(span, ctx.computedCols.value);
  const startCol = offset > 0 ? offset + 1 : 1;

  return {
    gridColumn: `${startCol} / span ${spanValue}`,
    order: config.order ?? 0,
  };
}
