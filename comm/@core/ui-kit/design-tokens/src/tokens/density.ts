/**
 * 密度 Design Token。
 *
 * <p>三档密度模式：compact（紧凑）/ standard（标准）/ loose（宽松）。
 * 通过 data-density 属性在 <html> 上切换，各组件读取对应 CSS 变量适配。
 *
 * <p>切换方式：
 * <pre>{@code
 * import { useDensity } from '@ydsz-core/design-tokens/density';
 * const { setDensity } = useDensity();
 * setDensity('compact');
 * }</pre>
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\density.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

/** 密度模式 */
export type DensityMode = 'compact' | 'standard' | 'loose';

/** 密度模式列表 */
export const DENSITY_MODES: readonly DensityMode[] = ['compact', 'standard', 'loose'] as const;

/**
 * 紧凑模式 Token——减小间距与字号，单位面积内展示更多内容。
 */
export const COMPACT_TOKENS = {
  /** 组件内间距 */
  padding: '6px 10px',
  /** 表单项间距 */
  gap: '8px',
  /** 表格行高 */
  rowHeight: '36px',
  /** 字号缩放 */
  fontScale: 0.875,
} as const;

/**
 * 标准模式 Token——默认间距。
 */
export const STANDARD_TOKENS = {
  padding: '8px 14px',
  gap: '12px',
  rowHeight: '44px',
  fontScale: 1,
} as const;

/**
 * 宽松模式 Token——增大间距，适合大屏/触控场景。
 */
export const LOOSE_TOKENS = {
  padding: '12px 20px',
  gap: '16px',
  rowHeight: '52px',
  fontScale: 1.0625,
} as const;

/** 密度 Token 全映射 */
export const DENSITY_TOKEN_MAP: Record<DensityMode, typeof COMPACT_TOKENS> = {
  compact: COMPACT_TOKENS,
  standard: STANDARD_TOKENS,
  loose: LOOSE_TOKENS,
} as const;

/**
 * 生成 CSS 变量声明（用于注入 :root[data-density="..."]）。
 *
 * @param mode - 密度模式
 * @return CSS 变量声明字符串
 */
export function densityCSSVars(mode: DensityMode): string {
  const tokens = DENSITY_TOKEN_MAP[mode];
  return [
    `--ydsz-density-padding: ${tokens.padding};`,
    `--ydsz-density-gap: ${tokens.gap};`,
    `--ydsz-density-row-height: ${tokens.rowHeight};`,
    `--ydsz-density-font-scale: ${tokens.fontScale};`,
  ].join('\n  ');
}

/**
 * 生成全部密度的 CSS 选择器（插入 :root 即可全局切换）。
 *
 * @return 全密度 CSS 块
 */
export function generateDensityCSS(): string {
  const blocks: string[] = [];
  for (const mode of DENSITY_MODES) {
    blocks.push(`:root[data-density="${mode}"] {\n  ${densityCSSVars(mode)}\n}`);
  }
  return blocks.join('\n\n');
}
