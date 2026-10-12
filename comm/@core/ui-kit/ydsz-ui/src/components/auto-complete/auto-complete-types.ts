/**
 * AutoComplete 组件的类型契约。
 *
 * <p>对标 Element Plus Autocomplete + Ant Design AutoComplete：
 * <ul>
 *   <li>输入触发远端搜索（带防抖、缓存）</li>
 *   <li>下拉候选列表支持键盘导航</li>
 *   <li>支持自定义渲染、清空、loading 状态</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\auto-complete\auto-complete-types.ts
 * @author ydsz-team
 * @since 26.10.11
 */

/** 单条候选数据结构 */
export interface AutoCompleteOption<T = unknown> {
  /** 显示文字 */
  label: string;
  /** 选中后的真实值 */
  value: T;
  /** 是否禁用 */
  disabled?: boolean;
  /** 扩展数据 */
  raw?: Record<string, unknown>;
}

/** 数据源获取函数返回 */
export type AutoCompleteFetchMethod<T = unknown> = (
  query: string,
) => Promise<AutoCompleteOption<T>[]> | AutoCompleteOption<T>[];

/** AutoComplete 组件属性 */
export interface AutoCompleteProps<T = unknown> {
  /** 自定义 CSS class */
  class?: string;
  /** 组件值（受控模式） */
  modelValue?: T;
  /** 默认占位文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否自动聚焦 */
  autofocus?: boolean;
  /** 下拉列表最大展示条数（超出后启用虚拟滚动） */
  maxSuggestions?: number;
  /** 触发搜索的最少字符数（默认 1） */
  minLength?: number;
  /** 防抖延迟（毫秒），默认 300 */
  debounce?: number;
  /** 是否缓存搜索结果（默认 true） */
  cache?: boolean;
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  cacheTTL?: number;
  /** 是否开启大小写敏感匹配 */
  caseSensitive?: boolean;
  /** 自定义提取显示文字的方法 */
  valueKey?: string;
  /** 下拉面板宽度与输入框对齐 */
  alignPanelWidth?: boolean;
  /** 是否启用虚拟滚动（在大 maxSuggestions 时推荐启用） */
  virtualScroll?: boolean;
  /** 是否在加载中显示 fetching 状态（常用于远端搜索） */
  loading?: boolean;
}

/** AutoComplete 组件事件 */
export interface AutoCompleteEmits<T = unknown> {
  /** 选中值变化 */
  (e: 'update:modelValue', value: T | undefined): void;
  /** 原始 select 事件 */
  (e: 'select', option: AutoCompleteOption<T>): void;
  /** 搜索请求发起 */
  (e: 'search', query: string): void;
  /** 搜索请求完成 */
  (e: 'fetch-success', options: AutoCompleteOption<T>[]): void;
  /** 搜索请求失败 */
  (e: 'fetch-fail', error: unknown): void;
  /** 清空 */
  (e: 'clear'): void;
}
