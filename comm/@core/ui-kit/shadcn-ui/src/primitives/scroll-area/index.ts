/**
 * 滚动区域容器与滚动条的出口。
 *
 * 滚动条默认不随容器自动出现：需要自定义滚动条时才显式放置 YdScrollBarRoot，
 * 多数场景（跟随系统滚动条）只用 YdScrollArea 即可。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\scroll-area\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdScrollArea } from './YdScrollArea.vue';
export { default as YdScrollBarRoot } from './YdScrollBarRoot.vue';
