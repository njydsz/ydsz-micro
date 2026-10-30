/**
 * Dialog 组件 barrel。
 *
 * 声明式组件：YdDialog / YdDialogContent / YdDialogHeader / ... (Radix Vue 包装)
 * 命令式 API：useDialog().dialog.open({ component, props, header, ... })
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as ydDialog } from './dialog.vue';
export type { DialogProps, DialogEmits } from './dialog-types';

// 声明式组件
export { default as YdDialog } from './YdDialog.vue';
export { default as YdDialogClose } from './YdDialogClose.vue';
export { default as YdDialogContent } from './YdDialogContent.vue';
export { default as YdDialogDescription } from './YdDialogDescription.vue';
export { default as YdDialogFooter } from './YdDialogFooter.vue';
export { default as YdDialogHeader } from './YdDialogHeader.vue';
export { default as YdDialogScrollContent } from './YdDialogScrollContent.vue';
export { default as YdDialogTitle } from './YdDialogTitle.vue';
export { default as YdDialogTrigger } from './YdDialogTrigger.vue';

// 命令式 API
export { useDialog } from './use-dialog';
export type {
  DialogApi,
  DialogCloseReason,
  DialogInstance,
  DialogOptions,
  UseDialogReturn,
} from './use-dialog';
