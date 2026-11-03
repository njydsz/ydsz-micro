/**
 * InfiniteScroll 组件的 props / emits 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\infinite-scroll\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * InfiniteScroll 组件属性。
 */
export interface InfiniteScrollProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否已加载完毕（不再触发 load-more） */
  finished?: boolean;
  /** 是否正在加载（防重复触发） */
  loading?: boolean;
  /** 触发阈值（px），默认 100 */
  threshold?: number;
}

/**
 * InfiniteScroll 组件事件。
 */
export interface InfiniteScrollEmits {
  /** 滚动到底部触发加载更多 */
  (e: 'load-more'): void;
}
