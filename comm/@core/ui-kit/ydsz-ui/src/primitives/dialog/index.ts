/**
 * 对话框族的出口：导出根容器、触发器、内容区、标题描述与底部区。
 *
 * 同时提供 YdDialogContent 与 YdDialogScrollContent 两种内容区，按内容是否超高选用；
 * 两者共用其余部件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dialog\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdDialog } from './YdDialog.vue';
export { default as YdDialogClose } from './YdDialogClose.vue';
export { default as YdDialogContent } from './YdDialogContent.vue';
export { default as YdDialogDescription } from './YdDialogDescription.vue';
export { default as YdDialogFooter } from './YdDialogFooter.vue';
export { default as YdDialogHeader } from './YdDialogHeader.vue';
export { default as YdDialogScrollContent } from './YdDialogScrollContent.vue';
export { default as YdDialogTitle } from './YdDialogTitle.vue';
export { default as YdDialogTrigger } from './YdDialogTrigger.vue';
