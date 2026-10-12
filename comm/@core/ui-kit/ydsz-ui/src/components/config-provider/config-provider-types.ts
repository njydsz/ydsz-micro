/**
 * ConfigProvider 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\config-provider-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 主题模式 */
export type ConfigProviderTheme = 'light' | 'dark' | 'auto';

/** 国际化语种 */
export type LocaleLang = 'zh-CN' | 'en-US' | 'ja-JP' | 'zh-TW';

/** 密度模式 */
export type DensityMode = 'compact' | 'standard' | 'loose';

/**
 * ConfigProvider 组件属性。
 *
 * <p>作为应用级包裹层，通过 {@link useTheme} 单例将 {@link theme} 写入
 * <code>document.documentElement.dataset.theme</code>，从而让所有组件
 * 的 CSS 变量引用自动在 light/dark 之间切换。
 *
 * <p>同时支持 {@link locale} 控制全局国际化语种、{@link density} 控制全局密度档位。
 */
export interface ConfigProviderProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /**
   * 主题模式。
   * <ul>
   *   <li><code>light</code> — 固定浅色主题</li>
   *   <li><code>dark</code> — 固定暗色主题</li>
   *   <li><code>auto</code> — 跟随 prefers-color-scheme</li>
   * </ul>
   * @default 'auto'
   */
  theme?: ConfigProviderTheme;
  /**
   * 全局国际化语种。
   * <ul>
   *   <li><code>zh-CN</code> — 简体中文</li>
   *   <li><code>en-US</code> — English</li>
   *   <li><code>ja-JP</code> — 日本語</li>
   *   <li><code>zh-TW</code> — 繁體中文</li>
   * </ul>
   * @default 'zh-CN'
   */
  locale?: LocaleLang;
  /**
   * 全局密度档位。
   * <ul>
   *   <li><code>compact</code> — 紧凑：减小间距与字号</li>
   *   <li><code>standard</code> — 标准（默认）</li>
   *   <li><code>loose</code> — 宽松：增大间距</li>
   * </ul>
   * @default 'standard'
   */
  density?: DensityMode;
}

/**
 * ConfigProvider 组件事件。
 */
export interface ConfigProviderEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 主题变化回调 */
  (e: 'theme-change', theme: ConfigProviderTheme): void;
  /** 语种变化回调 */
  (e: 'locale-change', locale: LocaleLang): void;
  /** 密度变化回调 */
  (e: 'density-change', density: DensityMode): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
