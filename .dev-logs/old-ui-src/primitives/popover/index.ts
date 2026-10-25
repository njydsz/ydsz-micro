/**
 * 浮层三件套的出口，并额外透出 ydsz-vue 的 PopoverAnchor。
 *
 * Anchor 用于「浮层不贴着触发器、而要贴另一个元素」的场景，
 * 属于低频但无法用其它方式替代的能力，故一并导出。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\popover\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdPopover } from './YdPopover.vue';
export { default as YdPopoverContent } from './YdPopoverContent.vue';
export { default as YdPopoverTrigger } from './YdPopoverTrigger.vue';
export { PopoverAnchor } from '@ydsz-core/ydsz-vue';
