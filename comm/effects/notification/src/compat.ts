/**
 * @deprecated 自 v4.2.0 起标记为弃用，EP 退场过渡专用子路径。
 *
 * <p>Element Plus 命令式 API 兼容入口 —— 仅作 EP 退场过渡用途。
 *
 * <p>业务侧从此处导入 `ElMessage` / `ElMessageBox` / `ElNotification`，
 * 即可在不改动逻辑代码的前提下完成从 `element-plus` 的迁移。
 *
 * <p>禁止新增引用；长期目标：迁移至 showToast / ydzzConfirm / ydszAlert。
 *
 * @path comm/effects/notification/src/compat.ts
 * @author ydsz-team
 * @since 1.0.0
 * @deprecated 4.2.0 起弃用，仅作 EP 退场过渡用途。
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
