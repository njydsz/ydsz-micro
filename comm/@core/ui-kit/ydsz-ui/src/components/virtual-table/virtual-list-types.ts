/**
 * 虚拟列表共享类型定义。
 *
 * <p>YdVirtualList / YdVirtualTable 共同引用的 props 类型放在这里，
 * 避免两个组件文件之间产生循环依赖。
 *
 * <p>设计参考 PrimeVue VirtualScroller 与 TanStack Virtual 的 API：
 * <ul>
 *   <li>itemHeight / overscan 作为核心参数</li>
 *   <li>scrollHeight 控制视口高度</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\virtual-table\virtual-list-types.ts
 * @author ydsz-team
 * @since 26.09.17
 */

/** 虚拟列表组件 props */
export interface VirtualListProps {
  /** 数据源 */
  items: unknown[];
  /** 每项的预估高度（像素），默认 32 */
  itemHeight?: number;
  /** 视口高度（像素），默认 256 */
  scrollHeight?: number;
  /** 上下两侧额外渲染的缓冲项数，默认 5 */
  overscan?: number;
  /** 从数据项提取唯一 key 的函数 */
  getKey?: (item: unknown, index: number) => string | number;
  /** 自定义类名 */
  class?: string;
  /** 容器 tabindex */
  tabindex?: number;
}
