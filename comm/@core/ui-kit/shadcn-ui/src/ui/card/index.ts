/**
 * 卡片族的出口：导出 Card 及其五个分区子组件。
 *
 * 分区组件一并导出而非只给一个 Card 加具名插槽：插槽需要靠文档约定使用顺序，
 * 拆成组件后结构由模板显式表达，IDE 也能给出补全与校验。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Card } from './Card.vue';
export { default as CardContent } from './CardContent.vue';
export { default as CardDescription } from './CardDescription.vue';
export { default as CardFooter } from './CardFooter.vue';
export { default as CardHeader } from './CardHeader.vue';
export { default as CardTitle } from './CardTitle.vue';
