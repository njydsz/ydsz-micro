/**
 * 可拖拽分栏的出口：面板组、拖拽手柄，并把 radix 的 SplitterPanel 以 ResizablePanel 之名透出。
 *
 * 改名是为了让术语统一在 resizable 这套词汇上：
 * 面板（Panel）、手柄（Handle）、组（PanelGroup），
 * 避免调用方在同一处代码里混用 splitter 与 resizable 两种命名。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\resizable\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as ResizableHandle } from './ResizableHandle.vue';
export { default as ResizablePanelGroup } from './ResizablePanelGroup.vue';
export { SplitterPanel as ResizablePanel } from 'radix-vue';
