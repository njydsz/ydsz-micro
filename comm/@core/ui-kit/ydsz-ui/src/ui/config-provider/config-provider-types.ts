/**
 * ConfigProvider 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\config-provider-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 主题模式 */
export type ConfigProviderTheme = 'light' | 'dark' | 'auto';

/**
 * ConfigProvider 组件属性。
 *
 * <p>作为应用级包裹层，通过 {@link useTheme} 单例将 {@link theme} 写入
 * <code>document.documentElement.dataset.theme</code>，从而让所有组件
 * 的 CSS 变量引用自动在 light/dark 之间切换。
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
}

/**
 * ConfigProvider 组件事件。
 */
export interface ConfigProviderEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 主题变化回调 */
  (e: 'theme-change', theme: ConfigProviderTheme): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
