/**
 * 类型化通信契约层 — 为 message-broker 的开放 payload 提供编译期约束
 *
 * 背景（v4.3.2）：
 *   `MicroMessage<T>` 的 `action: string` 与 `payload: T` 之间没有关联，
 *   子应用间通信完全靠口头约定：
 *     - 主应用 `sendMessage('sub-a', 'getUser', { id: 1 })`
 *     - 子应用 `if (msg.action === 'getUesr')` ← 拼写错误编译期无提示，
 *       运行时静默收不到消息
 *     - payload 结构变更后，调用方无编译期反馈
 *
 * 设计：
 *   声明式注册契约（action → 请求/响应类型），运行时零开销。
 *   类型层用 TypeScript 的映射类型把契约表转成类型安全的 API，
 *   底层仍然走既有的 message-broker（不改动通信机制）。
 *
 * 用法：
 * ```ts
 * // 1. 声明契约（建议放在 comm/constants 或各子应用的 contracts.ts）
 * interface AppContract {
 *   getUser: { id: number };
 *   saveUser: { name: string };
 * }
 *
 * // 2. 发送（类型安全）
 * const user = await sendTypedRequest<AppContract, 'getUser', 'saveUser'>(
 *   'sub-a', 'getUser', { id: 1 },
 * );
 *
 * // 3. 接收（类型安全）
 * registerTypedHandler<AppContract, 'getUser'>('sub-a', 'getUser', (payload) => {
 *   // payload 自动推断为 { id: number }
 *   return { name: 'x' };
 * });
 * ```
 *
 * @path comm/effects/micro-kernel/src/message-contract.ts
 * @author ydsz-team
 * @since 4.3.2
 */

import { registerAppMessageHandler, sendRequest, type MicroMessage } from './message-broker';

/**
 * 契约表类型约束（仅请求侧，不含响应声明）。
 *
 * 需要声明响应类型时使用 `ContractWithResponse`。
 */
export type MessageContract = Record<string, unknown>;

/**
 * 契约表（含响应声明）的形态。
 *
 * 响应类型通过嵌套对象声明，便于在单一契约表中表达往返结构：
 * ```ts
 * interface MyContract {
 *   getUser: { id: number; response: { name: string } };
 * }
 * ```
 *
 * 注意：`response` 是**元数据字段**，不属于请求 payload，
 * 由 `RequestOf` 自动剔除。
 */
export type ContractWithResponse = Record<
  string,
  { response?: unknown } | Record<string, unknown>
>;

/**
 * 从契约表提取某个 action 的请求 payload 类型。
 *
 * 自动剔除契约中的 `response` 元数据字段，只保留业务字段。
 */
export type RequestOf<C extends ContractWithResponse, K extends keyof C> =
  Omit<C[K], 'response'>;

/**
 * 从契约表提取某个 action 的响应 payload 类型。
 *
 * 未声明 `response` 字段时回退为 `void`（单向通知）。
 */
export type ResponseOf<C extends ContractWithResponse, K extends keyof C> =
  C[K] extends { response?: infer R } ? (R extends undefined ? void : R) : void;

/**
 * 类型化的发送函数签名（供 microBridge 包装使用）。
 */
export type TypedSender = <
  C extends ContractWithResponse,
  K extends keyof C,
>(
  to: string,
  action: K,
  payload: RequestOf<C, K>,
  timeout?: number,
) => Promise<ResponseOf<C, K>>;

/**
 * 类型化的接收函数签名。
 */
export type TypedHandlerRegistrar = <
  C extends ContractWithResponse,
  K extends keyof C,
>(
  app: string,
  action: K,
  handler: (payload: RequestOf<C, K>) => ResponseOf<C, K> | Promise<ResponseOf<C, K>>,
) => () => void;

/**
 * 把类型化契约适配到既有 message-broker 的发送侧。
 *
 * 只做类型擦除包装：运行时行为与 `sendRequest` 完全一致，
 * 因此不引入新的通信路径、不改变消息格式。
 *
 * @param to - 目标应用
 * @param action - 契约中的 action 名
 * @param payload - 契约对应的请求负载（编译期校验）
 * @param timeout - 超时时间（ms）
 * @returns 契约声明的响应类型（运行时是 message.payload）
 */
export function sendTypedRequest<
  C extends ContractWithResponse,
  K extends keyof C,
>(
  to: string,
  action: K,
  payload: RequestOf<C, K>,
  timeout?: number,
): Promise<ResponseOf<C, K>> {
  return sendRequest(to, String(action), payload, timeout) as Promise<ResponseOf<C, K>>;
}

/**
 * 把类型化契约适配到既有 message-broker 的接收侧。
 *
 * @param app - 应用名
 * @param action - 契约中的 action 名
 * @param handler - 类型化处理器
 * @returns 注销函数（与 registerAppMessageHandler 一致）
 */
export function registerTypedHandler<
  C extends ContractWithResponse,
  K extends keyof C,
>(
  app: string,
  action: K,
  handler: (payload: RequestOf<C, K>) => ResponseOf<C, K> | Promise<ResponseOf<C, K>>,
): () => void {
  return registerAppMessageHandler(app, (message: MicroMessage) => {
    if (message.action !== String(action)) return undefined;
    return handler(message.payload as RequestOf<C, K>);
  });
}
