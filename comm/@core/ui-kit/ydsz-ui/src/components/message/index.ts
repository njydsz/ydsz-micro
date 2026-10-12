/**
 * @file index.ts
 * @description 消息反馈组件与命令式 API 的出口集合。
 *
 * <p>组件：
 * <ul>
 *   <li>YdMessage —— 单条消息框（声明式，可独立使用）</li>
 * </ul>
 *
 * <p>命令式 API：
 * <ul>
 *   <li>useMessage() —— 命令式推送，底层走 MessageProvider 或模块级独立容器</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\message\index.ts
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 新增 useMessage 命令式 API)
 */
export { default as YdMessage } from './YdMessage.vue'
export { useMessage } from './useMessage'
export { MESSAGE_PROVIDER_KEY } from './useMessage'
export type {
  MessageConfig,
  MessageHandle,
  MessageInstance,
  MessageType,
} from './types'
export type {
  MessageProviderContext,
  UseMessageHandler,
} from './useMessage'
