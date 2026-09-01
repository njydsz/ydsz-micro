/**
 * 悬停卡片的出口：导出 YDSZHoverCard，并透出 radix 的内容区 props 类型。
 *
 * 透出内容区类型是为了让业务在自定义卡片内容对齐方式时无需直接依赖 radix-vue。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\hover-card\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZHoverCard } from './hover-card.vue';
export type { HoverCardContentProps } from 'radix-vue';

