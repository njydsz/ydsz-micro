/**
 * 通知中心列表项的数据契约。
 *
 * 与后端消息结构解耦：组件只依赖本类型，接入新的消息来源时只需在
 * 数据层做一次映射，不必改组件。
 *
 * @path comm\effects\layouts\src\widgets\notification\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
interface NotificationItem {
  /** 发送方头像地址 */
  avatar: string;
  /** 消息产生时间，展示前已格式化为可读文本 */
  date: string;
  /** 是否已读，缺省按未读处理（用于展示未读小圆点） */
  isRead?: boolean;
  /** 消息正文摘要 */
  message: string;
  /** 消息标题 */
  title: string;
}

export type { NotificationItem };
