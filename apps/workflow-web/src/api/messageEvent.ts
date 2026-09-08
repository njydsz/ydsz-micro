/**
 * 消息事件 API 封装（前端）
 *
 * <p>对应后端 {@code MessageEventController}，提供消息事件发布能力。
 * 外部系统可通过此接口发布消息事件，唤醒所有订阅该消息的等待节点。
 * <p>路径规范: /api/workflow/message-event/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @author ydsz-team
 * @path apps/workflow-web/src/api/messageEvent.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 发布消息事件请求 DTO（对齐后端 {@code MessageEventController.PublishMessageRequest}） */
export interface PublishMessageRequestDTO {
  /** 消息名称（必填，对应流程中消息节点的订阅名称） */
  messageName?: string;
  /** 关联键（可选，用于匹配特定的等待节点实例） */
  correlationKeys?: Record<string, string>;
}

/**
 * 发布消息事件。
 *
 * <p>POST /api/workflow/message-event/publish
 * <p>外部系统发送消息事件，唤醒所有订阅该消息的等待节点。
 *
 * @param data - 发布消息请求
 * @returns 唤醒的等待节点数量描述
 */
export function publishMessageEvent(data: PublishMessageRequestDTO): Promise<string> {
  return requestClient.post<string>('/api/workflow/message-event/publish', data);
}
