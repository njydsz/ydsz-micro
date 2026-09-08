/**
 * 响应式通知流 API 封装（前端）
 *
 * <p>对应后端 {@code ReactiveNotificationController}，提供 SSE 事件流订阅、事件发布、健康检测能力。
 * <p>路径规范: /api/message/reactive/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * <p><b>SSE 流式端点说明：</b>
 * {@code GET /api/message/reactive/stream} 使用原生 EventSource 消费，
 * 不使用 requestClient；{@code #/utils/sse-client.ts} 的 {@link openSseStream} 提供封装。
 *
 * @author ydsz-team
 * @path apps/message-web/src/api/reactive.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 事件级别（对齐后端 {@code ReactiveEvent.level}） */
export type ReactiveEventLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/** 响应式事件数据（对齐后端 {@code ReactiveEvent}） */
export interface ReactiveEventVO {
  /** 事件唯一标识 */
  eventId?: string;
  /** 事件类型（notification / heartbeat / system 等） */
  eventType?: string;
  /** 目标用户 ID（null 表示广播） */
  targetUserId?: string;
  /** 事件标题 */
  title?: string;
  /** 事件正文 */
  content?: string;
  /** 事件级别（INFO / WARN / ERROR / CRITICAL） */
  level?: ReactiveEventLevel;
  /** 扩展业务数据 */
  data?: Record<string, unknown>;
  /** 事件生成时间戳（UTC ISO 8601） */
  timestamp?: string;
}

/** 事件发布请求 DTO */
export interface ReactivePublishDTO {
  /** 事件类型（默认 notification） */
  eventType?: string;
  /** 目标用户 ID（可选，不填则广播） */
  targetUserId?: string;
  /** 事件标题 */
  title?: string;
  /** 事件正文 */
  content?: string;
  /** 事件级别（默认 INFO） */
  level?: ReactiveEventLevel;
  /** 扩展业务数据（可选） */
  data?: Record<string, unknown>;
}

/** 健康检测响应 */
export interface ReactiveHealthVO {
  /** 运行状态 */
  status?: string;
  /** 运行模式 */
  mode?: string;
  /** 缓冲区大小 */
  bufferSize?: string;
}

/**
 * 发布事件到响应式流。
 *
 * <p>POST /api/message/reactive/publish
 *
 * @param data - 事件发布请求数据
 * @returns 推送结果
 */
export function publishEvent(data: ReactivePublishDTO): Promise<string> {
  return requestClient.post<string>('/api/message/reactive/publish', data);
}

/**
 * 健康检测端点。
 *
 * <p>GET /api/message/reactive/health
 *
 * @returns 注册表运行状态
 */
export function healthCheck(): Promise<ReactiveHealthVO> {
  return requestClient.get<ReactiveHealthVO>('/api/message/reactive/health');
}
