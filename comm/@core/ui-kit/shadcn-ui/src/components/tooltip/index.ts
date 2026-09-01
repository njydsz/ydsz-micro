/**
 * 文字提示相关组件的出口：YDSZTooltip（自带 Provider 的通用提示）与 YDSZHelpTooltip（问号帮助提示）。
 *
 * 两个组件都内置 Provider，因此同一处使用时无需外部再包一层；
 * 需要全局统一延迟时才改用 ui/tooltip 下的原子组件自行组装。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\tooltip\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZHelpTooltip } from './help-tooltip.vue';
export { default as YDSZTooltip } from './tooltip.vue';
