/**
 * SSE 客户端工具（基于 @ydsz/shared-auth streamRequest 的业务分发层）
 *
 * <p>用于消费后端 text/event-stream 接口（如 {@code /api/v1/message/batch/progress/{batchId}/sse}），
 * 相比浏览器 EventSource 的优势：可携带鉴权头、可控中断、可续传 Last-Event-ID。
 *
 * <p>v4.3.1 重构：鉴权头注入与 SSE 帧解析（fetch + ReadableStream）下沉至
 * 共享基础设施 {@link streamRequest}（云顶规范 §6.1：业务代码禁裸 fetch），
 * 本文件仅保留消息业务事件分发（onOpen/onEvent/onClose）与 abort 生命周期管理。
 *
 * @path apps/message-web/src/utils/sse-client.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { streamRequest } from '@ydsz/shared-auth';

/** SSE 事件回调集合 */
export interface SseEventHandlers {
  /** 已收到首个有效帧，进入 live 状态 */
  onOpen?: () => void;
  /** 按事件名分发数据（data 无事件名的帧统一为 message 事件） */
  onEvent?: (eventName: string, data: Record<string, unknown> | null) => void;
  /** 流正常收尾（服务端关闭连接） */
  onClose?: () => void;
  /** 网络/解析异常（主动取消不触发） */
  onError?: (error: unknown) => void;
}

export interface SseStreamOptions {
  /** 外部中止信号（调用方负责 abort，用于关闭抽屉/组件卸载时断开连接） */
  signal?: AbortSignal;
  /** 断线续传标记（Last-Event-ID） */
  lastEventId?: string;
}

/** 解析单个 JSON 数据帧，失败返回 null */
function safeParseJson(raw: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * 打开一条 SSE 流。
 *
 * <p>启动后立即返回关闭函数；连接状态通过回调驱动（onOpen→live、onClose/onError→终态）。
 * 鉴权与帧解析由 {@link streamRequest} 承担（含 HttpOnly Cookie 模式自动跳过 Authorization 头）。
 *
 * @param url 相对路径（如 /api/v1/message/...）或完整 URL
 * @param handlers 事件回调 + 流选项
 * @returns 关闭连接函数（幂等，可重复调用）
 */
export function openSseStream(
  url: string,
  handlers: SseEventHandlers & SseStreamOptions,
): () => void {
  const { signal, lastEventId, onOpen, onEvent, onClose, onError } = handlers;

  const controller = new AbortController();
  const isAborted = (): boolean => controller.signal.aborted || (signal?.aborted ?? false);

  const externalAbort = (): void => controller.abort();
  signal?.addEventListener('abort', externalAbort, { once: true });

  /** 统一收尾：解绑外部信号、中止内部请求 */
  const closeStream = (): void => {
    signal?.removeEventListener('abort', externalAbort);
    if (!controller.signal.aborted) controller.abort();
  };

  const run = async (): Promise<void> => {
    const headers: Record<string, string> = {};
    if (lastEventId) headers['Last-Event-ID'] = lastEventId;

    let opened = false;

    try {
      await streamRequest({
        url,
        method: 'GET',
        headers,
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          if (!opened) {
            opened = true;
            onOpen?.();
          }
          onEvent?.(event ?? 'message', data.trim() !== '' ? safeParseJson(data) : null);
        },
      });
      if (!isAborted()) onClose?.();
    } catch (error: unknown) {
      if (!isAborted()) onError?.(error);
    } finally {
      closeStream();
    }
  };

  void run();
  return closeStream;
}
