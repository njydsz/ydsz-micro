/**
 * @file types.ts
 * @description 命令式消息反馈的公共类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\message\types.ts
 * @author ydsz-team
 * @since 26.09.17
 */

/** 消息类型 */
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

/** 消息配置项 */
export interface MessageConfig {
  /** 消息文本内容 */
  content: string
  /** 类型 */
  type?: MessageType
  /** 自动关闭延迟（ms），0 表示不自动关闭 */
  duration?: number
  /** 是否显示关闭按钮 */
  isClosable?: boolean
  /** 关闭回调 */
  onClose?: () => void
}

/** 内部消息实例（含运行时状态） */
export interface MessageInstance extends MessageConfig {
  /** 唯一标识 */
  id: string
  /** 创建时间戳 */
  createdAt: number
  /** 消息类型（内部必填） */
  type: MessageType
}

/** 命令式 API 返回句柄 */
export interface MessageHandle {
  /** 立即关闭该消息 */
  close: () => void
}
