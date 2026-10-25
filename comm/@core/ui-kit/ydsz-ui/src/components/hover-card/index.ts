/**
 * 悬停卡片的出口：导出 YdHoverCardSmart，并透出 radix 的内容区 props 类型。
 *
 * 透出内容区类型是为了让业务在自定义卡片内容对齐方式时无需直接依赖 ydsz-vue。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\hover-card\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdHoverCardSmart } from './YdHoverCardSmart.vue';
export type { HoverCardContentProps } from '@ydsz-core/ydsz-vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdHoverCard } from './YdHoverCard.vue';
export { default as YdHoverCardContent } from './YdHoverCardContent.vue';
export { default as YdHoverCardTrigger } from './YdHoverCardTrigger.vue';
export { default as ydHoverCard } from './hover-card.vue';
export type { HoverCardProps } from './hover-card-types';
