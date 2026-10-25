/**
 * 滚动区域容器与滚动条的出口。
 *
 * 滚动条默认不随容器自动出现：需要自定义滚动条时才显式放置 YdScrollBar，
 * 多数场景（跟随系统滚动条）只用 YdScrollArea 即可。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\scroll-area\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdScrollArea } from './YdScrollArea.vue';
export { default as YdScrollBar } from './YdScrollBar.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as ydScrollArea } from './scroll-area.vue';
export type { ScrollAreaProps } from './scroll-area-types';
