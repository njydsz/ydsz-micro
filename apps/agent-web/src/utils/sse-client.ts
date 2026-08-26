/**
 * Agent SSE 客户端工具（基于 @ydsz/shared-auth streamRequest 的业务分发层）
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
 * <p>v4.3.1 重构：鉴权头注入与 SSE 帧解析（fetch + ReadableStream）下沉至
 * 共享基础设施 {@link streamRequest}（云顶规范 §6.1：业务代码禁裸 fetch），
 * 本文件仅保留 Agent 业务事件分发（chunk/done/error）与 abort 生命周期管理。
 *
 * @path apps/agent-web/src/utils/sse-client.ts
 * @author ydsz-team
 * @since 4.2.0
 */
import { streamRequest } from '@ydsz/shared-auth';

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
 * 打开一条 Agent 流式 SSE 连接（POST 请求体 + 事件回调）。
 *
 * <p>鉴权与帧解析由 {@link streamRequest} 承担（含 HttpOnly Cookie 模式自动跳过
 * Authorization 头）；返回关闭函数（幂等），配合外部 signal 供「停止生成」
 * 与组件卸载时断开连接。
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

  const run = async (): Promise<void> => {
    let opened = false;

    const dispatch = (eventName: string, rawData: string): void => {
      if (!opened) {
        opened = true;
        onOpen?.();
      }
      const data = rawData.trim() !== '' ? safeParseJson(rawData) : null;
      switch (eventName) {
        case 'chunk':
          onChunk?.({
            content: String(data?.content ?? ''),
            finished: Boolean(data?.finished),
            finishReason:
              typeof data?.finishReason === 'string' ? (data.finishReason as string) : undefined,
            toolCalls: data?.toolCalls,
          });
          break;
        case 'done':
          onDone?.();
          break;
        case 'error':
          onError?.(
            new Error(
              typeof data?.error === 'string' ? (data.error as string) : 'Agent 流式响应异常',
            ),
          );
          break;
        default:
          // message / 未知事件忽略
          break;
      }
    };

    try {
      await streamRequest({
        url,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        data: body,
        signal: controller.signal,
        onEvent: ({ event, data }) => dispatch(event ?? 'message', data),
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
