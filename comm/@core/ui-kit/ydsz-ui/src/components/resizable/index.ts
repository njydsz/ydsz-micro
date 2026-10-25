/**
 * Resizable 组件 barrel。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */
export { default as ydResizable } from './resizable.vue';
export type { ResizableProps } from './resizable-types';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdResizableHandle } from './YdResizableHandle.vue';
export { default as YdResizablePanelGroup } from './YdResizablePanelGroup.vue';
export { SplitterPanel as YdResizablePanel } from '@ydsz-core/ydsz-vue';
