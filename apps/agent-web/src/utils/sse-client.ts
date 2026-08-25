/**
 * Agent SSE 客户端工具（POST + fetch ReadableStream 解析）
 *
 * <p>用于消费后端 AgentController 的流式接口（{@code POST /api/v1/agent/chat/stream}、
 * {@code POST /api/v1/agent/execute/stream}）。后端 SseExecutor 统一推送三种事件：
 * <ul>
 *   <li>{@code chunk}：data 形如 {@code {content, finished, finishReason?, toolCalls?}}</li>
 *   <li>{@code done}：data 形如 {@code {content: '', finished: true}}</li>
 *   <li>{@code error}：data 形如 {@code {error, finished: true}}</li>
 * </ul>
 * 心跳帧为注释帧（{:keep-alive}），解析器自动忽略。
 *
 * @path apps/agent-web/src/utils/sse-client.ts
 * @author ydsz-team
 * @since 4.2.0
 */
import { useTokenStore } from '@ydsz/stores';

/** 流式分片数据（对应后端 sent {@code chunk} 事件负载） */
export interface AgentStreamChunk {
  content?: string;
  finished?: boolean;
  finishReason?: string;
  toolCalls?: unknown;
}

/** Agent SSE 事件回调 */
export interface AgentSseEventHandlers {
  /** 已收到首个有效帧 */
  onOpen?: () => void;
  /** 增量文本分片 */
  onChunk?: (chunk: AgentStreamChunk) => void;
  /** 服务端 done 事件（完整回复结束） */
  onDone?: () => void;
  /** 服务端 error 事件或网络异常（主动取消不触发） */
  onError?: (error: unknown) => void;
  /** 流正常收尾 */
  onClose?: () => void;
}

export interface AgentStreamOptions {
  /** 外部中止信号（调用方负责 abort，用于停止生成/组件卸载） */
  signal?: AbortSignal;
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
 * 打开一条 Agent 流式 SSE 连接（POST 请求体 + 事件回调）。
 *
 * <p>鉴权：自动从 {@link useTokenStore} 读取 accessToken 注入 Authorization 头；
 * 返回关闭函数（幂等），配合外部 signal 供「停止生成」与组件卸载时断开连接。
 *
 * @param url 相对路径（如 /api/v1/agent/chat/stream）
 * @param body 请求体（ChatRequestDTO / AgentExecutionRequestDTO，弱类型直传）
 * @param handlers 事件回调 + 流选项
 * @returns 关闭连接函数
 */
export function openAgentStream(
  url: string,
  body: Record<string, unknown>,
  handlers: AgentSseEventHandlers & AgentStreamOptions,
): () => void {
  const { signal, onOpen, onChunk, onDone, onError, onClose } = handlers;

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
    const headers = new Headers({ accept: 'text/event-stream', 'content-type': 'application/json' });
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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
        const eventName = frame.event ?? 'message';
        const data = frame.data && frame.data.trim() !== '' ? safeParseJson(frame.data) : null;
        switch (eventName) {
          case 'chunk':
            onChunk?.({
              content: String(data?.content ?? ''),
              finished: Boolean(data?.finished),
              finishReason: typeof data?.finishReason === 'string' ? (data.finishReason as string) : undefined,
              toolCalls: data?.toolCalls,
            });
            break;
          case 'done':
            onDone?.();
            break;
          case 'error':
            onError?.(new Error(typeof data?.error === 'string' ? (data.error as string) : 'Agent 流式响应异常'));
            break;
          default:
            // message / 未知事件忽略
            break;
        }
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