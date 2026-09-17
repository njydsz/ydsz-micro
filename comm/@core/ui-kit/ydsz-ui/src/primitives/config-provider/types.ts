/**
 * YdConfigProvider 配置上下文类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { LocaleLang } from '../../locale/useLocale';

/** 组件密度档位 */
export type Density = 'default' | 'compact' | 'loose';

/** 基础组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large';

/** 主题配置 */
export interface ThemeConfig {
  /** 主题模式：'light' | 'dark' | 'auto' */
  mode?: string;
  /** 预设名（如 'light' / 'dark' / 'compact' / 自定义 registerPreset 名） */
  preset?: string;
}

/** wave 动效配置 */
export interface WaveConfig {
  /** 是否禁用 wave 动效 */
  isDisabled?: boolean;
}

/** 国际化配置 */
export interface LocaleConfig {
  /** 激活语种 */
  lang?: LocaleLang;
  /** 是否启用 RTL（右到左书写方向） */
  isRTL?: boolean;
  /**
   * 自定义文案覆写（按语种分区）。
   * 优先级最高：业务传入 > 内置双语包。
   */
  messages?: Partial<Record<LocaleLang, Record<string, string>>>;
}

/** 注入上下文类型 */
export interface ConfigContext {
  /** 基础组件尺寸全局覆盖 */
  size?: ComponentSize;
  /** 密度：影响间距、字号、行高 */
  density?: Density;
  /** CSS 前缀类名 */
  prefixCls?: string;
  /** 国际化配置 */
  locale?: LocaleConfig;
  /** 空状态占位渲染器 */
  renderEmpty?: () => unknown;
  /** wave 动效开关 */
  wave?: WaveConfig;
  /** 全局禁用态（所有交互组件置灰） */
  isDisabled?: boolean;
  /** 主题配置 */
  theme?: ThemeConfig;
}
