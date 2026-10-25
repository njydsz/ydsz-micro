/**
 * YdPopoverSmart 的出口。
 *
 * 与 ui/popover 下的同名组件区分开：这一版把 Root / Trigger / Content 合成为单个组件，
 * 适合内容简单、调用方不想关心三件套的场景；需要精细控制浮层时用 ui/popover。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\popover\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdPopoverSmart } from './YdPopoverSmart.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdPopover } from './YdPopover.vue';
export { default as YdPopoverContent } from './YdPopoverContent.vue';
export { default as YdPopoverTrigger } from './YdPopoverTrigger.vue';
export { PopoverAnchor } from '@ydsz-core/ydsz-vue';
export { default as ydPopover } from './popover.vue';
export type { PopoverProps } from './popover-types';

// 兼容旧引用名（消费方仍以 *Base 命名引用原子组件）
export { default as YdPopoverBase } from './YdPopover.vue';
export { default as YdPopoverContentBase } from './YdPopoverContent.vue';
export { default as YdPopoverTriggerBase } from './YdPopoverTrigger.vue';
