/**
 * 手风琴四件套（容器 / 条目 / 触发器 / 内容）的出口。
 *
 * 四个组件必须成套使用：radix 通过上下文关联触发器与内容，
 * 只引入其中一部分会导致展开动画与 aria 关联失效。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\accordion\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Accordion } from './Accordion.vue';
export { default as AccordionContent } from './AccordionContent.vue';
export { default as AccordionItem } from './AccordionItem.vue';
export { default as AccordionTrigger } from './AccordionTrigger.vue';
