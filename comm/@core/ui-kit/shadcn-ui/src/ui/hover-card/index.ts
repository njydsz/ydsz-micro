/**
 * 悬停卡片三件套（容器 / 触发器 / 浮层）的出口。
 *
 * 未内置 Provider：HoverCard 的延迟在 Root 上配置（openDelay / closeDelay），
 * 不需要像 Tooltip 那样共享延迟，因此也就不必多一层包装。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\hover-card\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as HoverCard } from './HoverCard.vue';
export { default as HoverCardContent } from './HoverCardContent.vue';
export { default as HoverCardTrigger } from './HoverCardTrigger.vue';
