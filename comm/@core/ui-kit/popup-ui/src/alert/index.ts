/**
 * 提示弹窗的出口：alert / confirm / prompt 三个命令式入口、类型与清空方法。
 *
 * 导出时把 YdAlert 等重命名为 alert / confirm / prompt，
 * 是为了让调用点读起来贴近原生习惯；同时保留原名类型以便精确引用。
 *
 * @path comm\@core\ui-kit\popup-ui\src\alert\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type {
  YdAlertProps,
  BeforeCloseScope,
  IconType,
  YdPromptProps,
} from './alert';
export { useAlertContext } from './alert';
export { default as YdAlert } from './YdAlert.vue';
export {
  YdAlert as alert,
  clearAllAlerts,
  YdConfirm as confirm,
  YdPrompt as prompt,
} from './AlertBuilder';
