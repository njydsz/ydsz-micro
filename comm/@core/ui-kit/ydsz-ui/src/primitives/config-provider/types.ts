/**
 * YdConfigProvider 配置上下文类型定义。
 *
 * 把 ConfigContext 从 Vue SFC 抽到独立模块，避免 YdConfigProvider.vue ↔ useConfigProvider.ts
 * 之间的循环导入，同时让 composables 可以不依赖 .vue 文件直接引用类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

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

/** 注入上下文类型 */
export interface ConfigContext {
  /** 基础组件尺寸全局覆盖 */
  size?: ComponentSize;
  /** 密度：影响间距、字号、行高 */
  density?: Density;
  /** CSS 前缀类名 */
  prefixCls?: string;
  /** 国际化文案覆写 */
  locale?: Record<string, string>;
  /** 空状态占位渲染器 */
  renderEmpty?: () => unknown;
  /** wave 动效开关 */
  wave?: WaveConfig;
  /** 全局禁用态（所有交互组件置灰） */
  isDisabled?: boolean;
  /** 主题配置 */
  theme?: ThemeConfig;
}
