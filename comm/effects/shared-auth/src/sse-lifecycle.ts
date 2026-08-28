/**
 * sse-lifecycle.ts — SSE 连接生命周期封装（openSseRequest）
 *
 * 在 streamRequest 之上提供统一的「连接生命周期管理」：
 * - 外部 AbortSignal 与内部 AbortController 的绑定/解绑
 * - 首帧触发 onOpen
 * - 正常收尾 onClose / 异常 onError（主动取消不触发）
 * - 返回幂等的关闭函数
 *
 * 此前该骨架在 agent-web / message-web 各复制一份，v4.4.0 收敛至此；
 * 业务事件分发（chunk/done/error 等）仍由各应用的业务层承担。
 *
 * @path comm/effects/shared-auth/src/sse-lifecycle.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import { streamRequest } from './sse';

/** 解析单个 JSON 数据帧，失败返回 null */
export function safeParseSseJson(raw: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** SSE 连接事件回调集合 */
export interface SseLifecycleHandlers {
  /** 已收到首个有效帧，进入 live 状态 */
  onOpen?: () => void;
  /** 按事件名分发数据（data 无事件名的帧统一为 message 事件；data 为空时传 null） */
  onEvent?: (eventName: string, data: Record<string, unknown> | null) => void;
  /** 流正常收尾（服务端关闭连接，主动取消不触发） */
  onClose?: () => void;
  /** 网络/解析异常（主动取消不触发） */
  onError?: (error: unknown) => void;
}

export interface SseRequestOptions extends SseLifecycleHandlers {
  /** SSE 端点（相对路径或完整 URL） */
  url: string;
  /** HTTP 方法，GET 默认，POST 需自行携带 content-type 头 */
  method?: string;
  /** 附加请求头（如 Last-Event-ID、content-type） */
  headers?: Record<string, string>;
  /** 请求体（POST 场景） */
  data?: unknown;
  /** 外部中止信号（调用方负责 abort：停止生成/关闭抽屉/组件卸载） */
  signal?: AbortSignal;
}

/**
 * 打开一条 SSE 流。
 *
 * <p>启动后立即返回关闭函数；连接状态通过回调驱动（onOpen → live、onClose/onError → 终态）。
 * 鉴权与帧解析由 {@link streamRequest} 承担（含 HttpOnly Cookie 模式自动跳过 Authorization 头）。
 *
 * @param options 端点、方法、请求头/体 + 生命周期回调
 * @returns 关闭连接函数（幂等，可重复调用）
 */
export function openSseRequest(options: SseRequestOptions): () => void {
  const { url, method = 'GET', headers = {}, data, signal, onOpen, onEvent, onClose, onError } =
    options;

  const controller = new AbortController();
  const isAborted = (): boolean => controller.signal.aborted || (signal?.aborted ?? false);

  const externalAbort = (): void => controller.abort();
  signal?.addEventListener('abort', externalAbort, { once: true });

  /** 统一收尾：解绑外部信号、中止内部请求 */
  const closeStream = (): void => {
    signal?.removeEventListener('abort', externalAbort);
    if (!controller.signal.aborted) controller.abort();
  };

  let opened = false;

  const run = async (): Promise<void> => {
    try {
      await streamRequest({
        url,
        method,
        headers,
        data,
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          if (!opened) {
            opened = true;
            onOpen?.();
          }
          onEvent?.(event ?? 'message', data.trim() !== '' ? safeParseSseJson(data) : null);
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
