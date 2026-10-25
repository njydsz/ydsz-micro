/**
 * Sheet 组件 barrel。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */
export { default as ydSheet } from './sheet.vue';
export type { SheetProps } from './sheet-types';

// merged from pre-refactor ui/ + primitives/ barrels
export * from './sheet';
export { default as YdSheet } from './YdSheet.vue';
export { default as YdSheetClose } from './YdSheetClose.vue';
export { default as YdSheetContent } from './YdSheetContent.vue';
export { default as YdSheetDescription } from './YdSheetDescription.vue';
export { default as YdSheetFooter } from './YdSheetFooter.vue';
export { default as YdSheetHeader } from './YdSheetHeader.vue';
export { default as YdSheetTitle } from './YdSheetTitle.vue';
export { default as YdSheetTrigger } from './YdSheetTrigger.vue';
