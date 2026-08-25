/**
 * SSE 客户端工具（基于 fetch + ReadableStream 的手写解析）
 *
 * <p>用于消费后端 text/event-stream 接口（如 {@code /api/v1/message/batch/progress/{batchId}/sse}），
 * 相比浏览器 EventSource 的优势：可携带鉴权头、可控中断、可续传 Last-Event-ID。
 *
 * @path apps/message-web/src/utils/sse-client.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { useTokenStore } from '@ydsz/stores';

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

interface SseFrame {
  event?: string;
  data?: string;
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

/** 解析单个 SSE 帧块（event/data 字段；注释、id、retry 帧忽略） */
function parseSseFrame(block: string): SseFrame | null {
  const dataLines: string[] = [];
  let eventName: string | undefined;
  const lines = block.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    switch (field) {
      case 'event':
        eventName = value;
        break;
      case 'data':
        dataLines.push(value);
        break;
      default:
        // id / retry / 未知字段忽略
        break;
    }
  }
  if (!eventName && dataLines.length === 0) return null;
  return { event: eventName, data: dataLines.length ? dataLines.join('\n') : undefined };
}

/**
 * 打开一条 SSE 流。
 *
 * <p>启动后立即返回关闭函数；连接状态通过回调驱动（onOpen→live、onClose/onError→终态）。
 * 鉴权：自动从 {@link useAccessStore} 读取 accessToken 注入 Authorization 头。
 *
 * @param url 相对路径（如 /api/v1/message/...）或完整 URL
 * @param handlers 事件回调 + 流选项
 * @returns 关闭连接函数（幂等，可重复调用）
 */
export function openSseStream(url: string, handlers: SseEventHandlers & SseStreamOptions): () => void {
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

  // 同步读取 token（调用方处于组件 setup，pinia 已激活）
  const accessToken = useTokenStore().accessToken;

  const run = async (): Promise<void> => {
    const headers = new Headers({ accept: 'text/event-stream' });
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    if (lastEventId) headers.set('last-event-id', lastEventId);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`SSE 请求失败：HTTP ${response.status}`);
      }
      if (!response.body) {
        throw new Error('当前环境不支持 ReadableStream，无法消费 SSE 流');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let opened = false;

      const dispatch = (frame: SseFrame): void => {
        if (!opened) {
          opened = true;
          onOpen?.();
        }
        const data = frame.data && frame.data.trim() !== '' ? safeParseJson(frame.data) : null;
        onEvent?.(frame.event ?? 'message', data);
      };

      for (;;) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const frame = parseSseFrame(block);
          if (frame) dispatch(frame);
        }
      }
      // 兜底：无结尾空行的最后一帧
      if (buffer.trim()) {
        const frame = parseSseFrame(buffer);
        if (frame) dispatch(frame);
      }
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