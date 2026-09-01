/**
 * SSE / 流式响应客户端（shared-auth 基础设施层）
 *
 * <p>支持后端 SSE（Server-Sent Events）与增量流式响应，用于：
 * <ul>
 *   <li>agent 对话流：{@code POST /api/v1/agent/chat/stream}、{@code /execute/stream}</li>
 *   <li>auth 事件推送：{@code GET /api/v1/auth/events}（SSE）</li>
 * </ul>
 *
 * <p><b>设计说明：</b>
 * <ul>
 *   <li>基于 fetch + ReadableStream 解析 SSE 帧（{@code data: ...\n\n}），可携带 Authorization 头（EventSource 无法自定义请求头）；</li>
 *   <li>Token 复用 {@link useTokenStore} 注入（HttpOnly Cookie 模式下自动跳过）；</li>
 *   <li>支持 AbortSignal 取消（组件卸载/超时），支持断线重连（可选）；</li>
 * </ul>
 *
 * <p>本文件属于基础设施层，允许直接使用 fetch（云顶编码规范 6.1 例外条款）。
 * // @infra-fetch 基础设施层直用，无统一客户端上下文
 *
 * @path comm\effects\shared-auth\src\sse.ts
 * @author ydsz-team
 * @since 1.0.0
 */
// @infra-fetch 基础设施层直用，无统一客户端上下文
import { useTokenStore } from '@ydsz/stores';

/** SSE 事件回调 */
export interface SseEvent {
  /** 事件名（默认 message） */
  event?: string;
  /** 事件数据（已按 text/plain 解析） */
  data: string;
  /** 原始事件 ID（可选） */
  id?: string;
}

/**
 * 类型化 SSE 帧（流数据已反序列化为 T）。
 *
 * <p>由 streamRequestAsync 配合类型参数生成，将 {@link SseEvent.data} 自动
 * 解析为类型 T 的业务对象，消费方无需自行 JSON.parse。
 *
 * @template T 业务数据类型（如 ChatChunk / ProgressEvent）
 */
export interface TypedSseEvent<T = unknown> extends Omit<SseEvent, 'data'> {
  /** 已解析的业务数据 */
  data: T;
}

/** 流式请求配置 */
export interface StreamRequestOptions {
  /** 完整请求 URL（含 baseURL） */
  url: string;
  /** 请求方法（默认 POST） */
  method?: 'GET' | 'POST';
  /** 请求体（POST 时 JSON 序列化） */
  data?: unknown;
  /** 额外请求头 */
  headers?: Record<string, string>;
  /** 单帧回调 */
  onEvent?: (event: SseEvent) => void;
  /** 流结束回调（正常或异常） */
  onDone?: () => void;
  /** 取消信号 */
  signal?: AbortSignal;
}

/** 解析 SSE 文本块，切分出完整帧（data:/event:/id: 字段，空行分隔） */
export function parseSseChunk(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    if (!block.trim()) {
      continue;
    }
    const event: SseEvent = { event: 'message', data: '' };
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        event.data += (event.data ? '\n' : '') + line.slice(5).trimStart();
      } else if (line.startsWith('event:')) {
        event.event = line.slice(6).trim();
      } else if (line.startsWith('id:')) {
        event.id = line.slice(3).trim();
      }
    }
    if (event.data) {
      events.push(event);
    }
  }
  return { events, rest };
}

/**
 * 发起流式请求并逐帧回调（fetch + ReadableStream 解析 SSE）
 *
 * @example
 * ```ts
 * const ac = new AbortController();
 * await streamRequest({
 *   url: '/api/v1/agent/chat/stream',
 *   method: 'POST',
 *   data: { message: '你好' },
 *   onEvent: ({ data }) => appendToChat(data),
 *   signal: ac.signal,
 * });
 * ```
 */
export async function streamRequest(options: StreamRequestOptions): Promise<void> {
  const {
    url,
    method = 'POST',
    data,
    headers = {},
    onEvent,
    onDone,
    signal,
  } = options;

  const tokenStore = useTokenStore();
  const requestHeaders: Record<string, string> = {
    Accept: 'text/event-stream',
    ...headers,
  };
  // HttpOnly Cookie 模式下前端无 accessToken，不注入 Authorization 头
  const token = tokenStore.accessToken;
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    signal,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`[streamRequest] HTTP ${response.status}: ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error('[streamRequest] 响应体为空，无法读取流');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
     
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseChunk(buffer);
      buffer = rest;
      for (const evt of events) {
        onEvent?.(evt);
      }
    }
    // 处理残留（无空行结尾的最后一帧）
    if (buffer.trim()) {
      const tail = parseSseChunk(buffer + '\n\n');
      for (const evt of tail.events) {
        onEvent?.(evt);
      }
    }
  } finally {
    onDone?.();
  }
}

// =====================================================================
// AsyncIterable 模式（for-await-of 友好）—— P2-9：类型化流式 SDK 基础
// =====================================================================

/** AsyncIterable 模式的可迭代流选项（与 StreamRequestOptions 去回调） */
export interface StreamAsyncOptions {
  /** 完整请求 URL（含 baseURL） */
  url: string;
  /** 请求方法（默认 POST） */
  method?: 'GET' | 'POST';
  /** 请求体（POST 时 JSON 序列化） */
  data?: unknown;
  /** 额外请求头 */
  headers?: Record<string, string>;
  /** 取消信号 */
  signal?: AbortSignal;
}

/**
 * 发起流式请求，返回 AsyncIterable 以支持 {@code for-await-of} 消费。
 *
 * <p>相比 callback 风格的 {@link streamRequest}：
 * <ul>
 *   <li>更符合「async/await + 迭代」的现代代码风格</li>
 *   <li>组件卸载时通过 break / return() 自动中止 reader</li>
 *   <li>生成的 AsyncGenerator 在外部 signal 触发时抛出 AbortError</li>
 * </ul>
 *
 * <p>配合 {@link TypedSseEvent} 类型参数与调用方显式 {@code JSON.parse} 使用，
 * 具体的类型化包装由 SDK 生成器输出（见 bash/gen-streaming-sdk.mjs）。
 *
 * @example
 * ```ts
 * const stream = streamRequestAsync<ChatChunk>({ url: '/api/v1/agent/chat/stream', data: req });
 * for await (const evt of stream) {
 *   // evt.data 为字符串，调用方 parse: evt.data as ChatChunk
 *   appendToChat(JSON.parse(evt.data));
 * }
 * ```
 */
export async function* streamRequestAsync(
  options: StreamAsyncOptions,
): AsyncGenerator<SseEvent, void, unknown> {
  const { url, method = 'POST', data, headers = {}, signal } = options;

  const tokenStore = useTokenStore();
  const requestHeaders: Record<string, string> = {
    Accept: 'text/event-stream',
    ...headers,
  };
  const token = tokenStore.accessToken;
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    signal,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`[streamRequestAsync] HTTP ${response.status}: ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error('[streamRequestAsync] 响应体为空，无法读取流');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseChunk(buffer);
      buffer = rest;
      for (const evt of events) {
        yield evt;
      }
    }
    // 处理残留帧
    if (buffer.trim()) {
      const tail = parseSseChunk(buffer + '\n\n');
      for (const evt of tail.events) {
        yield evt;
      }
    }
  } finally {
    reader.cancel().catch(() => {
      /* ignore: reader 已完成或已被取消 */
    });
  }
}

