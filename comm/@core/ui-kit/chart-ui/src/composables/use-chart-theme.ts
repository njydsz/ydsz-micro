/**
 * useChartTheme —— 依据当前明暗模式与 design-token 生成 ECharts 主题。
 *
 * <p>主题色来源：
 * <ul>
 *   <li>语义色（primary / success / warning / destructive / neutral）通过
 *       {@link colorTokenVar} 解析为 `var(--ydsz-color-*-500)` CSS 变量引用，
 *       保证图表与界面元素取自同一套 token；</li>
 *   <li>文本 / 边框 / 表面色通过 {@link textTokenVar} / {@link borderTokenVar} /
 *       {@link surfaceTokenVar} 解析。</li>
 * </ul>
 *
 * <p>明暗检测：优先读取参数 {@link UseChartThemeOptions.dark}，未显式传入时
 * 回退到 `document.documentElement.classList.contains('dark')`，与
 * ConfigProvider 写入的 class 保持一致。
 *
 * @path comm\@core\ui-kit\chart-ui\src\composables\use-chart-theme.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComputedRef } from 'vue';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import {
  borderTokenVar,
  colorTokenVar,
  surfaceTokenVar,
  textTokenVar,
} from '@ydsz-core/design-tokens';

/** 语义色角色（与 design-tokens 的 SemanticRole 对齐） */
export type ChartSemanticColor = 'brand' | 'destructive' | 'neutral' | 'success' | 'warning';

/** 图表调色板：语义色 + 中性阶，供 series 循环取色 */
export interface ChartPalette {
  /** 语义色序列（按 brand / success / warning / destructive / neutral 排列） */
  readonly colors: readonly string[];
  /** 主色（品牌色） */
  readonly primary: string;
  /** 成功色 */
  readonly success: string;
  /** 警告色 */
  readonly warning: string;
  /** 危险色 */
  readonly destructive: string;
  /** 中性色 */
  readonly neutral: string;
}

/** 由 design-token 生成的 ECharts 主题对象 */
export interface ChartTheme {
  /** 调色板 */
  readonly palette: ChartPalette;
  /** 主文本色 */
  readonly textColor: string;
  /** 次要文本色（坐标轴标签、副标题） */
  readonly textMutedColor: string;
  /** 边框 / 分割线颜色 */
  readonly borderColor: string;
  /** 卡片 / 图例背景色 */
  readonly surfaceColor: string;
  /** 次级表面色（tooltip 背景） */
  readonly surfaceColor2: string;
  /** 是否暗色 */
  readonly dark: boolean;
}

/** useChartTheme 配置 */
export interface UseChartThemeOptions {
  /**
   * 是否暗色。
   *
   * <p>不传时按 `document.documentElement.classList.contains('dark')` 推断，
   * 并通过 MutationObserver 跟随 class 变化实时更新。
   */
  dark?: boolean;
}

/** 主题对应的 ECharts 主题名（注册到 echarts 后通过 init(el, name) 使用） */
export const CHART_THEME_DARK = 'ydsz-dark' as const;
export const CHART_THEME_LIGHT = 'ydsz-light' as const;

/** 主题名联合类型 */
export type ChartThemeName = typeof CHART_THEME_DARK | typeof CHART_THEME_LIGHT;

/**
 * 从 design-token 返回的 `var(--xxx)` 表达式提取为合法 CSS 值。
 *
 * @param tokenVar - design-token 返回的 `var(--xxx)` 表达式
 * @returns 规范化的 `var(--xxx)` 引用；解析失败时回退原值
 */
function cssVar(tokenVar: string): string {
  return tokenVar.trim() || 'inherit';
}

/**
 * 生成语义色调色板。
 *
 * @returns 语义色映射
 */
function buildPalette(): ChartPalette {
  return {
    colors: [
      cssVar(colorTokenVar('brand', 500)),
      cssVar(colorTokenVar('success', 500)),
      cssVar(colorTokenVar('warning', 500)),
      cssVar(colorTokenVar('destructive', 500)),
      cssVar(colorTokenVar('neutral', 500)),
      cssVar(colorTokenVar('brand', 300)),
      cssVar(colorTokenVar('success', 300)),
      cssVar(colorTokenVar('warning', 300)),
    ],
    destructive: cssVar(colorTokenVar('destructive', 500)),
    neutral: cssVar(colorTokenVar('neutral', 500)),
    primary: cssVar(colorTokenVar('brand', 500)),
    success: cssVar(colorTokenVar('success', 500)),
    warning: cssVar(colorTokenVar('warning', 500)),
  };
}

/**
 * 读取根节点是否为暗色模式。
 *
 * @returns `document.documentElement` 上是否挂有 `.dark`
 */
function detectDark(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.documentElement.classList.contains('dark');
}

/**
 * useChartTheme —— 生成与当前主题联动的 ECharts 主题。
 *
 * @param options - 配置项
 * @returns 主题对象、响应式暗色状态、主题名与 ECharts 主题注册对象
 *
 * @example
 * ```ts
 * const { theme, themeName, themeOption } = useChartTheme();
 * const chart = echarts.init(el, themeName.value, { theme: themeOption.value });
 * ```
 */
export function useChartTheme(options: UseChartThemeOptions = {}): {
  theme: ComputedRef<ChartTheme>;
  themeName: ComputedRef<ChartThemeName>;
  themeOption: ComputedRef<Record<string, unknown>>;
  isDark: ComputedRef<boolean>;
} {
  const isDark = ref<boolean>(options.dark ?? detectDark());
  const palette = buildPalette();

  /**
   * 跟随根节点 `.dark` class 变化。
   *
   * <p>仅在未显式传入 `dark` 时建立观察；显式传入时以 Props 为准，
   * 由调用方自行控制主题切换。
   */
  if (options.dark === undefined && typeof document !== 'undefined') {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      isDark.value = root.classList.contains('dark');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    onBeforeUnmount(() => observer.disconnect());
  }

  if (options.dark !== undefined) {
    watch(
      () => options.dark,
      (value) => {
        isDark.value = value ?? false;
      },
    );
  }

  const theme = computed<ChartTheme>(() => ({
    borderColor: cssVar(borderTokenVar('DEFAULT')),
    dark: isDark.value,
    palette,
    surfaceColor: cssVar(surfaceTokenVar(1)),
    surfaceColor2: cssVar(surfaceTokenVar(2)),
    textColor: cssVar(textTokenVar('primary')),
    textMutedColor: cssVar(textTokenVar('secondary')),
  }));

  const themeName = computed<ChartThemeName>(() =>
    isDark.value ? CHART_THEME_DARK : CHART_THEME_LIGHT,
  );

  /**
   * ECharts 注册主题对象。
   *
   * <p>仅包含颜色相关字段：color 调色板 / textStyle / 通用边框。
   * 图表组件通过 `theme.color` 与 `theme.textStyle.color` 读取，保证与界面同色。
   */
  const themeOption = computed<Record<string, unknown>>(() => ({
    backgroundColor: 'transparent',
    borderColor: theme.value.borderColor,
    color: [...theme.value.palette.colors],
    textStyle: {
      color: theme.value.textColor,
      fontFamily: 'inherit',
    },
    title: {
      textStyle: { color: theme.value.textColor },
    },
    legend: {
      textStyle: { color: theme.value.textMutedColor },
    },
    tooltip: {
      backgroundColor: theme.value.surfaceColor2,
      borderColor: theme.value.borderColor,
      textStyle: { color: theme.value.textColor },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: theme.value.borderColor } },
      axisLabel: { color: theme.value.textMutedColor },
      splitLine: { lineStyle: { color: theme.value.borderColor } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: theme.value.borderColor } },
      axisLabel: { color: theme.value.textMutedColor },
      splitLine: { lineStyle: { color: theme.value.borderColor } },
    },
  }));

  return {
    isDark: computed(() => isDark.value),
    theme,
    themeName,
    themeOption,
  };
}

/**
 * 把主题色注入到图表 option 的通用字段。
 *
 * <p>仅覆盖调用方未显式指定的颜色字段，避免业务自定义被默认值冲掉。
 *
 * @param option - 原始 ECharts 配置
 * @param theme - 当前主题
 * @returns 合并后的配置
 */
export function withChartTheme<T extends Record<string, unknown>>(
  option: T,
  theme: ChartTheme,
): T {
  return {
    ...option,
    color: option.color ?? [...theme.palette.colors],
    textStyle: {
      color: theme.textColor,
      ...(option.textStyle as Record<string, unknown> | undefined),
    },
  };
}
