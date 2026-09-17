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
export { default as YdSheet } from './YdSheet.vue';
export { default as YdSheetClose } from './YdSheetClose.vue';
export { default as YdSheetContent } from './YdSheetContent.vue';
export { default as YdSheetDescription } from './YdSheetDescription.vue';
export { default as YdSheetFooter } from './YdSheetFooter.vue';
export { default as YdSheetHeader } from './YdSheetHeader.vue';
export { default as YdSheetTitle } from './YdSheetTitle.vue';

export { default as YdSheetTrigger } from './YdSheetTrigger.vue';
