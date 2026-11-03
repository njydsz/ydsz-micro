/**
 * YDSZ UI — 内置主题 Preset 注册表。
 *
 * <p>提供多套差异化视觉风格预设，覆盖科技蓝 / 森林绿 / 暖阳橙 / 皇家紫四种品牌色调。
 * 每个 preset 是一组 semantic 层 token 的覆盖值，通过 {@link useTheme.applyPreset} 应用。
 *
 * <p>用法：
 * <pre>
 * import { themePresets, useTheme } from '@ydsz-core/ydsz-ui';
 *
 * const theme = useTheme();
 * theme.applyPreset('ocean-blue');
 * // 或传入自定义 preset
 * theme.applyPreset('brand-custom', { primary: '199 89% 48%', ... });
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme\theme-presets.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { ThemePreset } from './use-theme';

/** 科技蓝 —— 沉稳、专业的企业平台风格 */
export const oceanBluePreset: ThemePreset = {
  primary: '222.2 47.4% 11.2%',
  'primary-foreground': '210 40% 98%',
  'primary-hover': '217.2 32.6% 17.5%',
  secondary: '210 40% 96.1%',
  'secondary-foreground': '222.2 47.4% 11.2%',
  accent: '210 40% 96.1%',
  info: '217.2 91.2% 59.8%',
  success: '142.1 76.2% 36.3%',
  warning: '38 92.2% 50.2%',
  destructive: '0 84.2% 60.2%',
};

/** 森林绿 —— 自然、健康的生态风格 */
export const forestGreenPreset: ThemePreset = {
  primary: '142.1 76.2% 36.3%',
  'primary-foreground': '210 40% 98%',
  'primary-hover': '142.1 76.2% 28%',
  secondary: '142 40% 96%',
  'secondary-foreground': '142.1 76.2% 20%',
  accent: '142 40% 92%',
  info: '199 89% 48%',
  success: '142.1 76.2% 36.3%',
  warning: '38 92.2% 50.2%',
  destructive: '0 84.2% 60.2%',
};

/** 暖阳橙 —— 活力、温暖的创意风格 */
export const sunsetOrangePreset: ThemePreset = {
  primary: '25 95% 53.1%',
  'primary-foreground': '210 40% 98%',
  'primary-hover': '25 95% 45%',
  secondary: '25 40% 96%',
  'secondary-foreground': '25 95% 25%',
  accent: '25 40% 92%',
  info: '199 89% 48%',
  success: '142.1 76.2% 36.3%',
  warning: '38 92.2% 50.2%',
  destructive: '0 84.2% 60.2%',
};

/** 皇家紫 —— 高端、优雅的品质风格 */
export const royalPurplePreset: ThemePreset = {
  primary: '262.1 83.3% 57.8%',
  'primary-foreground': '210 40% 98%',
  'primary-hover': '262.1 83.3% 48%',
  secondary: '262 40% 96%',
  'secondary-foreground': '262.1 83.3% 20%',
  accent: '262 40% 92%',
  info: '217.2 91.2% 59.8%',
  success: '142.1 76.2% 36.3%',
  warning: '38 92.2% 50.2%',
  destructive: '0 84.2% 60.2%',
};

/** 石墨灰 —— 极简、中性的文档/工具风格 */
export const graphitePreset: ThemePreset = {
  primary: '0 0% 40%',
  'primary-foreground': '210 40% 98%',
  'primary-hover': '0 0% 30%',
  secondary: '0 0% 96%',
  'secondary-foreground': '0 0% 20%',
  accent: '0 0% 92%',
  info: '0 0% 50%',
  success: '142.1 76.2% 36.3%',
  warning: '38 92.2% 50.2%',
  destructive: '0 84.2% 60.2%',
  radius: '0.25rem',
};

/**
 * 全部内置 preset 的注册表。
 *
 * <p>key 为 preset 名称，value 为 token 覆盖映射。
 * 可通过 {@link registerThemePresets} 一次性注册到全局主题句柄。
 */
export const themePresets: Record<string, ThemePreset> = {
  'ocean-blue': oceanBluePreset,
  'forest-green': forestGreenPreset,
  'sunset-orange': sunsetOrangePreset,
  'royal-purple': royalPurplePreset,
  graphite: graphitePreset,
};

/** Preset 元信息：用于主题切换器的下拉选项 */
export interface ThemePresetMeta {
  /** preset 名称 */
  name: string;
  /** 展示标签（i18n key 或硬编码兜底） */
  label: string;
  /** 主色预览（HSL 字符串） */
  previewColor: string;
}

/** 全部内置 preset 的元信息列表 */
export const themePresetMeta: ThemePresetMeta[] = [
  { label: 'Ocean Blue', name: 'ocean-blue', previewColor: '222.2 47.4% 11.2%' },
  { label: 'Forest Green', name: 'forest-green', previewColor: '142.1 76.2% 36.3%' },
  { label: 'Sunset Orange', name: 'sunset-orange', previewColor: '25 95% 53.1%' },
  { label: 'Royal Purple', name: 'royal-purple', previewColor: '262.1 83.3% 57.8%' },
  { label: 'Graphite', name: 'graphite', previewColor: '0 0% 40%' },
];
