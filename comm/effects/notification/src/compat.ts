/**
 * Element Plus 命令式 API 兼容入口 —— 仅作 EP 退场过渡用途。
 *
 * <p>业务侧从此处导入 `ElMessage` / `ElMessageBox` / `ElNotification`，
 * 即可在不改动逻辑代码的前提下完成从 `element-plus` 的迁移。
 *
 * @path comm/effects/notification/src/compat.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export {
  ElMessage,
  ElMessageBox,
  ElNotification,
} from './el-bridge';
export type {
  ConfirmOptions,
  MessageArg,
  MessageOptions,
  MessageType,
  MessageBoxReturnValue,
  NotificationOptions,
  PromptOptions,
} from './el-bridge';
