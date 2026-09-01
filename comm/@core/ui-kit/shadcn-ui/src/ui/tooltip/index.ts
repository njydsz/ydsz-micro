/**
 * 文字提示四件套的出口：Provider、容器、触发器与内容区。
 *
 * Provider 单独导出，是因为延迟与跳过策略在 Provider 层生效；
 * 需要不同延迟的提示应各自包一层，而不是共享同一个 Provider。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tooltip\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Tooltip } from './Tooltip.vue';
export { default as TooltipContent } from './TooltipContent.vue';
export { default as TooltipProvider } from './TooltipProvider.vue';
export { default as TooltipTrigger } from './TooltipTrigger.vue';
