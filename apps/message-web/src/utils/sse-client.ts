/**
 * SSE 客户端工具 — @ydsz/shared-auth openSseRequest 的消息业务适配层
 *
 * <p>用于消费后端 text/event-stream 接口（如 {@code /api/v1/message/batch/progress/{batchId}/sse}）。
 * v4.3.1 鉴权与帧解析下沉至 streamRequest；v4.4.0 连接生命周期骨架
 * （onOpen/onEvent/onClose/onError + abort 管理）进一步收敛至共享层
 * {@link openSseRequest}，本文件仅保留类型别名与 re-export，消除跨应用重复代码。
 *
 * @path apps\message-web\src\utils\sse-client.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { openSseRequest, type SseLifecycleHandlers } from '@ydsz/shared-auth';

/** SSE 事件回调集合 */
export type SseEventHandlers = SseLifecycleHandlers;

/** SSE 流式连接配置选项 */
export interface SseStreamOptions {
  /** 断线续传标记（Last-Event-ID） */
  lastEventId?: string;
}

/**
 * 打开一条 SSE 流。
 *
 * <p>启动后立即返回关闭函数；连接状态通过回调驱动（onOpen → live、onClose/onError → 终态）。
 *
 * @param url 相对路径（如 /api/v1/message/...）或完整 URL
 * @param handlers 事件回调 + 流选项
 * @returns 关闭连接函数（幂等，可重复调用）
 */
export function openSseStream(
  url: string,
  handlers: SseEventHandlers & SseStreamOptions,
): () => void {
  const { lastEventId, ...lifecycle } = handlers;

  const headers: Record<string, string> = {};
  if (lastEventId) headers['Last-Event-ID'] = lastEventId;

  return openSseRequest({ url, method: 'GET', headers, ...lifecycle });
}
