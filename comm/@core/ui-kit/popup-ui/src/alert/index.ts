/**
 * index 模块
 *
 * @path comm\@core\ui-kit\popup-ui\src\alert\index.ts
 * @author remi-team
 * @since 1.0.0
 */
export type {
  AlertProps,
  BeforeCloseScope,
  IconType,
  PromptProps,
} from './alert';
export { useAlertContext } from './alert';
export { default as Alert } from './alert.vue';
export {
  remiAlert as alert,
  clearAllAlerts,
  remiConfirm as confirm,
  remiPrompt as prompt,
} from './AlertBuilder';
