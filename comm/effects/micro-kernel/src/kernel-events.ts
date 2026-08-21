/**
 * 内核事件通信 — 事件总线与消息传递
 *
 * 从 kernel.ts 提取的子应用点对点通信 API，
 * 提供 fire-and-forget 消息发送、请求-响应模式与全局消息监听。
 *
 * 包含：
 * - sendToApp: 向指定子应用发送消息（fire-and-forget）
 * - sendRequestToApp: 向指定子应用发送请求并 await 响应
 * - onAppMessage: 注册全局消息监听器（接收来自子应用的消息）
 *
 * @path comm/effects/micro-kernel/src/kernel-events.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import {
  registerAppMessageHandler,
  sendRequest as sendRequestImpl,
  sendMessage as sendSendMessageImpl,
  startMessageListener as startMessageListenerImpl,
} from "./message-broker";

/**
 * 内核消息 API 接口。
 *
 * 定义 createKernel 公开的点对点通信方法集合，
 * 供 KernelApi 字面量类型引用。
 */
export interface KernelMessagingAPI {
  /** 向指定子应用发送消息（fire-and-forget） */
  sendToApp(appName: string, action: string, payload?: unknown): string;
  /** 向指定子应用发送请求并 await 响应 */
  sendRequestToApp<T = unknown, R = unknown>(
    appName: string,
    action: string,
    payload?: T,
    timeout?: number,
  ): Promise<R>;
  /** 注册全局消息监听器（供主应用代码接收来自子应用的消息） */
  onAppMessage(
    handler: (message: {
      action: string;
      correlationId: string;
      from: string;
      payload: unknown;
    }) => void,
  ): () => void;
  /** 注册子应用消息处理器（内部使用，供 switchToApp 注入 mountProps 时调用） */
  registerAppMessageHandler(
    appName: string,
    handler: (msg: {
      action: string;
      from: string;
      payload: unknown;
      correlationId: string;
    }) => Promise<unknown> | unknown,
  ): () => void;
}

/**
 * 创建内核消息通信 API。
 *
 * 封装 message-broker 模块的底层函数，提供 Kernel 级别的
 * 类型安全与 JSDoc 文档。
 *
 * @returns 消息通信 API 对象
 */
export function createKernelMessagingAPI(): KernelMessagingAPI {
  /**
   * 向指定子应用发送消息（fire-and-forget）。
   *
   * @param appName - 目标子应用名
   * @param action - 业务 action
   * @param payload - 业务数据
   * @returns 消息 id（用于调试跟踪）
   */
  function sendToApp(
    appName: string,
    action: string,
    payload?: unknown,
  ): string {
    return sendSendMessageImpl(appName, action, payload);
  }

  /**
   * 向指定子应用发送请求并 await 响应。
   *
   * @param appName - 目标子应用名
   * @param action - 业务 action
   * @param payload - 业务数据
   * @param timeout - 超时（ms），默认 10000
   * @returns 子应用响应数据
   */
  function sendRequestToApp<T = unknown, R = unknown>(
    appName: string,
    action: string,
    payload?: T,
    timeout?: number,
  ): Promise<R> {
    return sendRequestImpl(appName, action, payload, timeout) as Promise<R>;
  }

  /**
   * 注册全局消息监听器（供主应用代码接收来自子应用的消息）。
   *
   * @param handler - 收到消息时回调
   * @returns 取消监听函数
   */
  function onAppMessage(
    handler: (message: {
      action: string;
      correlationId: string;
      from: string;
      payload: unknown;
    }) => void,
  ): () => void {
    return startMessageListenerImpl((msg) => {
      handler({
        from: msg.from,
        action: msg.action,
        payload: msg.payload,
        correlationId: msg.correlationId,
      });
    });
  }

  return {
    sendToApp,
    sendRequestToApp,
    onAppMessage,
    registerAppMessageHandler,
  };
}

// 重新导出，供 kernel.ts 直接使用
export { registerAppMessageHandler };
