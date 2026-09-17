/**
 * 确认对话框的出口：容器、标题、说明、确认、取消与内容区。
 *
 * 遮罩（YdAlertDialogOverlay）刻意不导出 —— 它由内容区内部渲染，
 * 对外暴露反而会让调用方绕过锁滚动与点击关闭的处理，属于实现细节。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\alert-dialog\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdAlertDialog } from './YdAlertDialog.vue';
export { default as YdAlertDialogAction } from './YdAlertDialogAction.vue';
export { default as YdAlertDialogCancel } from './YdAlertDialogCancel.vue';
export { default as YdAlertDialogContent } from './YdAlertDialogContent.vue';
export { default as YdAlertDialogDescription } from './YdAlertDialogDescription.vue';
export { default as YdAlertDialogTitle } from './YdAlertDialogTitle.vue';
