/**
 * 文字提示相关组件的出口：YdTooltipSmart（自带 Provider 的通用提示）与 YdHelpTooltip（问号帮助提示）。
 *
 * 两个组件都内置 Provider，因此同一处使用时无需外部再包一层；
 * 需要全局统一延迟时才改用 ui/tooltip 下的原子组件自行组装。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tooltip\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdHelpTooltip } from './YdHelpTooltip.vue';
export { default as YdTooltipSmart } from './YdTooltipSmart.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdTooltip } from './YdTooltip.vue';
export { default as YdTooltipContent } from './YdTooltipContent.vue';
export { default as YdTooltipProvider } from './YdTooltipProvider.vue';
export { default as YdTooltipTrigger } from './YdTooltipTrigger.vue';
export { default as ydTooltip } from './tooltip.vue';
export type { TooltipProps } from './tooltip-types';

// 兼容旧引用名（表单 UI 侧仍以 *Base 命名消费原子组件）
export { default as YdTooltipBase } from './YdTooltip.vue';
export { default as YdTooltipContentBase } from './YdTooltipContent.vue';
export { default as YdTooltipProviderBase } from './YdTooltipProvider.vue';
export { default as YdTooltipTriggerBase } from './YdTooltipTrigger.vue';
