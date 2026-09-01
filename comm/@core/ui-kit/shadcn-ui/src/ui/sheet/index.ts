/**
 * 抽屉组件的出口（容器、触发器、内容、标题、说明、页头页脚、关闭），以及 cva 变体。
 *
 * 变体一并导出，便于自定义抽屉内容时复用同一套方位与动画类名；
 * 遮罩（SheetOverlay）不导出，它由内容区内部渲染并负责锁滚动。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './sheet';
export { default as Sheet } from './Sheet.vue';
export { default as SheetClose } from './SheetClose.vue';
export { default as SheetContent } from './SheetContent.vue';
export { default as SheetDescription } from './SheetDescription.vue';
export { default as SheetFooter } from './SheetFooter.vue';
export { default as SheetHeader } from './SheetHeader.vue';
export { default as SheetTitle } from './SheetTitle.vue';

export { default as SheetTrigger } from './SheetTrigger.vue';
