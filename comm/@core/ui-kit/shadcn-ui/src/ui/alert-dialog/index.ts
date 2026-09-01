/**
 * 确认对话框的出口：容器、标题、说明、确认、取消与内容区。
 *
 * 遮罩（AlertDialogOverlay）刻意不导出 —— 它由内容区内部渲染，
 * 对外暴露反而会让调用方绕过锁滚动与点击关闭的处理，属于实现细节。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as AlertDialog } from './AlertDialog.vue';
export { default as AlertDialogAction } from './AlertDialogAction.vue';
export { default as AlertDialogCancel } from './AlertDialogCancel.vue';
export { default as AlertDialogContent } from './AlertDialogContent.vue';
export { default as AlertDialogDescription } from './AlertDialogDescription.vue';
export { default as AlertDialogTitle } from './AlertDialogTitle.vue';
