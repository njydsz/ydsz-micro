/**
 * 卡片族的出口：导出 YdCard 及其五个分区子组件。
 *
 * 分区组件一并导出而非只给一个 YdCard 加具名插槽：插槽需要靠文档约定使用顺序，
 * 拆成组件后结构由模板显式表达，IDE 也能给出补全与校验。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\card\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdCard } from './YdCard.vue';
export { default as YdCardContent } from './YdCardContent.vue';
export { default as YdCardDescription } from './YdCardDescription.vue';
export { default as YdCardFooter } from './YdCardFooter.vue';
export { default as YdCardHeader } from './YdCardHeader.vue';
export { default as YdCardTitle } from './YdCardTitle.vue';
