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

/**
 * 打开一条 SSE 流所需的请求参数。
 *
 * 在 {@link SseLifecycleHandlers} 的回调集合之上叠加请求描述字段：
 * 回调描述「连接发生了什么」，请求字段描述「连到哪里、怎么连」。
 *
 * 全部回调均为可选，因此最短调用只需 `{ url, onEvent }`。
 */
export interface SseRequestOptions extends SseLifecycleHandlers {
  /** SSE 端点（相对路径或完整 URL）；相对路径由底层 request 实例拼接 baseURL */
  url: string;
  /** HTTP 方法，默认 `'GET'`；用 POST 时需自行在 `headers` 中携带 content-type */
  method?: string;
  /** 附加请求头，如 `Last-Event-ID`（断点续传）、`content-type`；鉴权头由底层自动注入，无需在此传 */
  headers?: Record<string, string>;
  /** 请求体（POST 场景），由底层序列化为 JSON */
  data?: unknown;
  /**
   * 外部中止信号，用于「停止生成」「关闭抽屉」「组件卸载」等业务主动取消。
   *
   * 触发后会级联中止内部请求，且按约定**不触发** onError/onClose，
   * 以便调用方区分「用户主动中断」与「连接异常中断」。
   */
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

  // 外部 signal 不直接透传给 streamRequest，而是转发到内部 controller：
  // 这样内部能在请求结束（含正常收尾）时统一 abort，避免外部 signal 已 abort
  // 的情况下 streamRequest 仍持有已完成的 reader 不释放
  const externalAbort = (): void => controller.abort();
  signal?.addEventListener('abort', externalAbort, { once: true });

  /** 统一收尾：解绑外部信号、中止内部请求 */
  const closeStream = (): void => {
    // 必须显式解绑：signal 通常由长生命周期对象（如组件作用域）持有，
    // 不解绑会让本闭包一直挂在它的监听器列表上，形成内存泄漏
    signal?.removeEventListener('abort', externalAbort);
    // 先判 aborted 再 abort，使 closeStream 幂等：abort() 本身安全，
    // 但可避免对已中止的 signal 重复派发 abort 事件
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
          // 以「收到首个有效帧」而非「fetch 建连成功」作为 open 时机：
          // 服务端可能已接受连接但迟迟不下发数据，此时 UI 仍应显示连接中
          if (!opened) {
            opened = true;
            onOpen?.();
          }
          // 空 data 帧（SSE 注释行或心跳）不能当 JSON 解析，统一映射为 null
          onEvent?.(event ?? 'message', data.trim() !== '' ? safeParseSseJson(data) : null);
        },
      });
      // 主动取消时静默结束：abort 会导致 streamRequest reject，
      // 若不在此拦截，用户点「停止生成」会弹错误提示
      if (!isAborted()) onClose?.();
    } catch (error: unknown) {
      if (!isAborted()) onError?.(error);
    } finally {
      // 无论成功/失败/取消都收尾，保证外部 signal 上的监听器一定被摘除
      closeStream();
    }
  };

  void run();
  return closeStream;
}
