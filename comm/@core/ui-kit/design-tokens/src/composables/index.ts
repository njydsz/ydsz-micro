/**
 * 主题与密度 CSS 生成工具：同时产出 light + dark + density 三套 CSS 变量块。
 *
 * 设计工具链注入时使用：一次性生成完整的 CSS 字符串，避免运行期多次
 * 操作 stylesheet 引发性能抖动。业务侧一般通过 import variables.css
 * 使用静态文件，本函数面向需要动态注入的场景（iframe / shadow-dom / micro-app）。
 *
 * @path comm\@core\ui-kit\design-tokens\src\composables\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { DensityMode } from '../tokens/density';

import { DENSITY_MODES, densityCSSVars } from '../tokens/density';

/** 无法在纯函数中读文件，由调用方拼接；此处占位符需替换为实际 CSS 内容 */
const LIGHT_CSS_PLACEHOLDER = '/* :root light variables — see styles/variables.css */';

/** 暗色覆盖块中 :root[data-theme="dark"] 对应的变量声明（节选自 styles/variables.css） */
const DARK_CSS_PLACEHOLDER = '/* :root[data-theme="dark"] overrides — see styles/variables.css */';

/**
 * 拼接完整的主题 + 密度 CSS 字符串。
 *
 * 拼接顺序：light 基础 → dark 覆盖 → 各密度档对应块。
 * 使用方应确保 light / dark 块中含有完整的 :root 选择器声明；
 * 本函数仅负责密度块追加。
 *
 * @param lightCss - 浅色主题完整 CSS（含 :root 选择器）
 * @param darkCss - 暗色主题覆盖 CSS（含 :root[data-theme='dark'] 选择器）
 * @returns 可整体写入 <style> 或独立 .css 文件的 CSS 字符串
 *
 * @example
 * ```ts
 * import lightCss from '../styles/variables.css?raw';
 * import darkCss from '../styles/dark.css?raw';
 * const fullCss = composeThemeAndDensityCSS(lightCss, darkCss);
 * ```
 */
export function composeThemeAndDensityCSS(lightCss: string, darkCss: string): string {
  const densityBlocks: string[] = [];
  for (const mode of DENSITY_MODES) {
    densityBlocks.push(`:root[data-density='${mode}'] {\n  ${densityCSSVars(mode)}\n}`);
  }

  return [lightCss, darkCss, ...densityBlocks].join('\n\n');
}

/**
 * 生成仅包含密度的 CSS（不包含亮/暗主题基础变量）。
 *
 * 适用于亮色变量已通过静态 CSS 文件加载、仅需动态增减密度档的场景。
 *
 * @returns 包含全部密度档 data-density 选择器的 CSS 字符串
 *
 * @example
 * ```ts
 * const densityCss = generateDensityOnlyCSS();
 * const style = document.createElement('style');
 * style.textContent = densityCss;
 * document.head.appendChild(style);
 * ```
 */
export function generateDensityOnlyCSS(): string {
  const blocks: string[] = [];
  for (const mode of DENSITY_MODES) {
    blocks.push(`:root[data-density='${mode}'] {\n  ${densityCSSVars(mode)}\n}`);
  }
  return blocks.join('\n\n');
}

export type { DensityMode };
export { DENSITY_MODES } from '../tokens/density';
export { initDensity, useDensity } from './use-density';
