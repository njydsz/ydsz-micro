/**
 * iframe 沙箱 RPC 桥接逻辑
 *
 * 从 iframe-sandbox.ts 提取跨 realm 通信（postMessage 桥接 + RPC 调用）的核心实现，
 * 包含：
 * - 主侧消息处理器（解析 state-sync / state-set / rpc-call / rpc-result 消息）
 * - RPC 请求-响应匹配（callId + Promise）
 * - 超时重试（指数退避）
 * - 主应用 API 注册（供子应用反向调用）
 *
 * @path comm/effects/micro-kernel/src/iframe-rpc.ts
 * @author ydsz-team
 * @since 3.6.1
 */

import {
  BRIDGE_MARK,
  isBridgeMessage,
  type BridgeMessage,
  type IframeRpcConfig,
  type RpcCallPayload,
  type RpcResultPayload,
} from "./iframe-types";

/** 待响应的 RPC 条目 */
interface PendingRpc {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * 创建 iframe 沙箱的 RPC 桥接子系统。
 *
 * 返回的 `onMessage` 需通过 `window.addEventListener("message", onMessage)` 注册。
 * 返回的 `postToChild` / `onChildMessage` / `callRpc` / `registerMainApi` 直接挂载到
 * IframeSandboxInstance 上。
 *
 * v4.3.0 安全加固：
 * - 主 → 子 postMessage 由 `'*'` 收敛为精确 targetOrigin（about:blank 继承宿主
 *   origin；devUrl 跨源模式取 devUrl origin）
 * - 接收侧在 source 校验（event.source === contentWindow）之外增加
 *   event.origin 白名单校验（expectedOrigins），拦截伪装消息
 *
 * @param contentWindow - iframe 的 contentWindow
 * @param rpc - 合并后的 RPC 配置
 * @param options - v4.3.0: 通道加固选项
 * @returns RPC 桥接函数集合
 *
 * @since 3.6.1
 */
export function createIframeRpc(
  contentWindow: Window,
  rpc: Required<IframeRpcConfig>,
  options: { targetOrigin?: string; expectedOrigins?: string[] } = {},
): {
  /** 主侧消息处理器（需注册到 window.addEventListener("message", ...)） */
  onMessage: (event: MessageEvent) => void;
  /** 主 → 子消息发送 */
  postToChild: (payload: unknown) => void;
  /** 注册子 → 主消息处理器 */
  onChildMessage: (
    handler: (payload: unknown) => void,
  ) => () => void;
  /** 主应用调用子应用 RPC 方法（异步，带超时重试） */
  callRpc: (method: string, args: unknown[]) => Promise<unknown>;
  /** 注册主应用 API 供子应用调用 */
  registerMainApi: (
    handlers: Record<string, (...args: any[]) => unknown>,
  ) => () => void;
  /** 清理所有待响应的 RPC（cleanup 时调用） */
  cleanupRpc: (appName: string) => void;
} {
  // v4.3.0: 主 → 子消息目标 origin（默认宿主 origin；devUrl 模式由调用方传入）
  const hostOrigin = window.location.origin;
  const targetOrigin =
    options.targetOrigin && options.targetOrigin !== "null"
      ? options.targetOrigin
      : hostOrigin && hostOrigin !== "null"
        ? hostOrigin
        : "*";
  // v4.3.0: 接收侧 origin 白名单（默认宿主 origin；为空时不校验 origin 仅校验 source）
  const expectedOrigins = options.expectedOrigins?.length
    ? new Set(options.expectedOrigins)
    : null;
  // v3.6.1: 子 → 主 RPC 处理器（子应用可调用的主应用 API）
  const mainApiHandlers: Record<
    string,
    (...args: any[]) => unknown
  > = {};
  // v3.6.1: 主 → 子 RPC 待响应 Map（callId → resolve/reject）
  const pendingRpcs = new Map<string, PendingRpc>();
  // v3.6.1: RPC 调用序号
  let rpcSeq = 0;
  // v3.6.0: 主侧消息处理器集合（子 → 主）
  const childMessageHandlers = new Set<(payload: unknown) => void>();

  // 主侧监听 iframe 发来的消息（通过 postMessage 回传）
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== contentWindow) return;
    // v4.3.0: origin 白名单校验（未配置白名单时跳过，仅依赖 source 校验）
    if (expectedOrigins && !expectedOrigins.has(event.origin)) return;
    const data = event.data;
    if (!isBridgeMessage(data)) return;
    if (data.type === "state-set") {
      for (const handler of childMessageHandlers) {
        try {
          handler(data.payload);
        } catch {
          // 单个 handler 异常不影响其他 handler
        }
      }
      return;
    }
    if (data.type === "rpc-result") {
      const payload = data.payload as RpcResultPayload;
      const pending = pendingRpcs.get(payload.callId);
      if (pending) {
        pendingRpcs.delete(payload.callId);
        if (payload.ok) {
          pending.resolve(payload.result);
        } else {
          pending.reject(new Error(payload.error || "RPC call failed"));
        }
      }
      return;
    }
    if (data.type === "rpc-call") {
      // 子应用调用主应用 API
      const payload = data.payload as RpcCallPayload;
      const handler = mainApiHandlers[payload.method];
      const respond = (ok: boolean, result?: unknown, error?: string) => {
        const response: BridgeMessage = {
          [BRIDGE_MARK]: true,
          type: "rpc-result",
          payload: { callId: payload.callId, ok, result, error },
        } as BridgeMessage;
        contentWindow.postMessage(response, targetOrigin);
      };
      if (typeof handler !== "function") {
        respond(false, undefined, `RPC method not found: ${payload.method}`);
        return;
      }
      try {
        // 使用 thenable 判定替代 (as Promise) 断言，兼容任意 thenable 返回值
        const result = handler(...payload.args);
        if (
          result &&
          typeof (result as { then?: unknown }).then === "function"
        ) {
          Promise.resolve(result).then(
            (value) => respond(true, value),
            (error) =>
              respond(false, undefined, String(error?.message || error)),
          );
        } else {
          respond(true, result);
        }
      } catch (error) {
        respond(
          false,
          undefined,
          String(error instanceof Error ? error.message : error),
        );
      }
    }
  };

  const postToChild = (payload: unknown): void => {
    if (!contentWindow) return;
    const message: BridgeMessage = {
      [BRIDGE_MARK]: true,
      type: "state-sync",
      payload,
    } as BridgeMessage;
    contentWindow.postMessage(message, targetOrigin);
  };

  const onChildMessage = (
    handler: (payload: unknown) => void,
  ): (() => void) => {
    childMessageHandlers.add(handler);
    return () => {
      childMessageHandlers.delete(handler);
    };
  };

  async function callRpc(
    method: string,
    args: unknown[] = [],
  ): Promise<unknown> {
    if (!contentWindow) {
      throw new Error("[IframeRpc] ContentWindow is not available");
    }

    // P1-3: 可重试的 RPC 调用
    const maxAttempts =
      rpc.retry.enabled && rpc.retry.isIdempotent(method)
        ? 1 + rpc.retry.maxRetries
        : 1;

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 重试等待（指数退避）
      if (attempt > 0) {
        const delay = rpc.retry.baseDelay * 2 ** (attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        // 重试前检查沙箱是否已关闭
        if (!contentWindow) {
          throw new Error("[IframeRpc] ContentWindow closed during retry");
        }
      }

      const callId = `p${++rpcSeq}`;
      const promise = new Promise<unknown>((resolve, reject) => {
        pendingRpcs.set(callId, { resolve, reject });
      });
      const message: BridgeMessage = {
        [BRIDGE_MARK]: true,
        type: "rpc-call",
        payload: { method, args, callId } satisfies RpcCallPayload,
      } as BridgeMessage;
      contentWindow.postMessage(message, targetOrigin);

      // P1-3: 使用可配置的超时时间
      const timeoutId = setTimeout(() => {
        const pending = pendingRpcs.get(callId);
        if (pending) {
          pendingRpcs.delete(callId);
          pending.reject(
            new Error(
              `[IframeRpc] RPC timeout: ${method} (attempt ${attempt + 1}/${maxAttempts})`,
            ),
          );
        }
      }, rpc.timeout);

      try {
        const result = await promise;
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // 不重试或已达到最大次数时抛出
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }
        // 继续下一次重试
      }
    }

    // 不可达（循环至少执行一次），兜底
    throw lastError ?? new Error(`[IframeRpc] RPC failed: ${method}`);
  }

  function registerMainApi(
    handlers: Record<string, (...args: any[]) => unknown>,
  ): () => void {
    for (const [method, handler] of Object.entries(handlers)) {
      mainApiHandlers[method] = handler;
    }
    return () => {
      for (const method of Object.keys(handlers)) {
        delete mainApiHandlers[method];
      }
    };
  }

  function cleanupRpc(appName: string): void {
    childMessageHandlers.clear();
    // v3.6.1: 清理待响应的 RPC 请求
    for (const { reject } of pendingRpcs.values()) {
      reject(new Error(`[IframeSandbox:${appName}] Sandbox closed`));
    }
    pendingRpcs.clear();
  }

  return {
    onMessage,
    postToChild,
    onChildMessage,
    callRpc,
    registerMainApi,
    cleanupRpc,
  };
}
