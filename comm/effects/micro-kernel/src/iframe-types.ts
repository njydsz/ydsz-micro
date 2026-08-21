/**
 * iframe 沙箱类型定义与桥接协议
 *
 * 从 iframe-sandbox.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/iframe-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** iframe 沙箱实例 */
export interface IframeSandboxInstance {
  /** iframe 的 contentWindow（子应用可用的隔离 window） */
  contentWindow: null | Window;
  /** iframe 的 contentDocument（子应用挂载用的隔离 document） */
  contentDocument: Document | null;
  /** 挂载容器元素（位于 iframe document 内） */
  container: HTMLElement | null;
  /** 激活沙箱 */
  activate: () => void;
  /** 停用沙箱 */
  deactivate: () => void;
  /** 清理沙箱（移除 iframe，释放资源） */
  cleanup: () => void;
  /**
   * 向子应用发送消息（主 → 子）。
   *
   * @since 3.6.0
   * @param payload - 任意可结构化克隆的消息体
   */
  postToChild: (payload: unknown) => void;
  /**
   * 注册子应用消息处理器（子 → 主）。
   *
   * @since 3.6.0
   * @param handler - 收到子应用消息时的回调
   * @returns 取消注册函数
   */
  onChildMessage: (handler: (payload: unknown) => void) => () => void;
  /**
   * 主应用调用子应用暴露的方法（RPC request-response 模式）。
   *
   * @since 3.6.1
   * @param method - 子应用通过 __MICRO_REGISTER_API__ 注册的方法名
   * @param args - 调用参数
   * @returns 子应用返回值（支持 Promise）
   */
  callRpc: (method: string, args?: unknown[]) => Promise<unknown>;
  /**
   * 注册主应用 API，供子应用通过 __MICRO_CALL_MAIN__ 调用。
   *
   * @since 3.6.1
   * @param handlers - method → 处理函数映射
   * @returns 取消注册函数
   */
  registerMainApi: (
    handlers: Record<string, (...args: any[]) => unknown>,
  ) => () => void;
}

/**
 * iframe 沙箱 RPC 配置（P1-3: 超时配置化 + 可选重试）。
 */
export interface IframeRpcConfig {
  /** RPC 超时（毫秒），默认 30_000 */
  timeout?: number;
  /**
   * 超时后是否自动重试（仅对幂等方法如 `getGlobalState` 重试）。
   *
   * 默认策略：
   * - 3 次尝试（包含原始调用 + 2 次重试）
   * - 仅当 timeout 触发且方法是 GET 类幂等操作时才重试
   * - 指数退避：delay = baseDelay * 2^attempt
   */
  retry?: {
    /** 重试基数延迟（毫秒），默认 1_000 */
    baseDelay?: number;
    /** 是否启用超时重试，默认 false */
    enabled: boolean;
    /**
     * 判断给定 method 是否可重试。
     * 默认：以 'get' / 'query' / 'fetch' 开头的方法视为幂等可重试。
     */
    isIdempotent?: (method: string) => boolean;
    /** 最大重试次数，默认 2 */
    maxRetries?: number;
  };
}

/** iframe 默认样式：撑满容器、无边框 */
export const IFRAME_STYLE =
  "width:100%;height:100%;border:0;display:block;margin:0;padding:0;";

/**
 * postMessage 桥接协议标记。
 *
 * 所有由本沙箱桥接发送的消息都带此标记，子侧/主侧据此区分微内核桥接消息
 * 与业务侧自己的 postMessage 通信，避免互相干扰。
 *
 * @since 3.6.0
 */
export const BRIDGE_MARK = "__MICRO_KERNEL_BRIDGE__";

/**
 * 桥接消息类型。
 *
 * - `state-sync`：主 → 子，globalState 快照同步
 * - `state-set`：子 → 主，子应用调用 setGlobalState
 * - `rpc-call`：主 → 子，RPC 调用（request-response 模式）
 * - `rpc-result`：子 → 主，RPC 调用结果
 *
 * @since 3.6.0
 */
export type BridgeMessageType = "rpc-call" | "rpc-result" | "state-set" | "state-sync";

/** RPC 调用消息体 */
export interface RpcCallPayload {
  /** 方法名（子应用在 iframe 中暴露） */
  method: string;
  /** 调用参数 */
  args: unknown[];
  /** 调用 ID，用于匹配响应 */
  callId: string;
}

/** RPC 结果消息体 */
export interface RpcResultPayload {
  /** 调用 ID（与请求一致） */
  callId: string;
  /** 是否成功 */
  ok: boolean;
  /** 返回值（ok=true 时） */
  result?: unknown;
  /** 错误信息（ok=false 时） */
  error?: string;
}

/** 桥接消息结构 */
export interface BridgeMessage<T = unknown> {
  [BRIDGE_MARK]: true;
  type: BridgeMessageType;
  payload: T;
}

/**
 * 判断消息是否为本沙箱桥接协议消息。
 *
 * @since 3.6.0
 */
export function isBridgeMessage(data: unknown): data is BridgeMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>)[BRIDGE_MARK] === true
  );
}

/** 默认 RPC 配置 */
export const DEFAULT_RPC_CONFIG: Required<IframeRpcConfig> = {
  timeout: 30_000,
  retry: {
    enabled: false,
    maxRetries: 2,
    baseDelay: 1000,
    isIdempotent: (method) =>
      /^(get|query|fetch|read|select|find)/i.test(method),
  },
};
