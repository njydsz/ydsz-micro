/**
 * 对话框族的出口：导出根容器、触发器、内容区、标题描述与底部区。
 *
 * 同时提供 DialogContent 与 DialogScrollContent 两种内容区，按内容是否超高选用；
 * 两者共用其余部件。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Dialog } from './Dialog.vue';
export { default as DialogClose } from './DialogClose.vue';
export { default as DialogContent } from './DialogContent.vue';
export { default as DialogDescription } from './DialogDescription.vue';
export { default as DialogFooter } from './DialogFooter.vue';
export { default as DialogHeader } from './DialogHeader.vue';
export { default as DialogScrollContent } from './DialogScrollContent.vue';
export { default as DialogTitle } from './DialogTitle.vue';
export { default as DialogTrigger } from './DialogTrigger.vue';
