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
// Vue 组件直接以 default 名义导出（避免与 AlertBuilder 的二义性冲突）
export { default } from './YdAlert.vue';
// 命令式 API：从 AlertBuilder 导出，名称互不冲突
export {
  YdAlert,
  YdConfirm,
  YdPrompt,
  clearAllAlerts,
} from './AlertBuilder';
