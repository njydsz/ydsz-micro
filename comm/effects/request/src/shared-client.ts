/**
 * 共享请求客户端单例。
 *
 * <p>为应用提供开箱即用的 requestClient 与 baseRequestClient 实例。
 * 预设拦截器（业务码判定、401 自动刷新、错误提示等）由各应用在启动阶段追加。
 *
 * <p>使用方式：
 * ```ts
 * import { requestClient, initSharedRequest } from '@ydsz/request';
 *
 * // 应用启动时初始化 baseURL
 * initSharedRequest({ baseURL: import.meta.env.VITE_API_BASE_URL });
 *
 * // 之后直接使用 requestClient 发请求 / 注册拦截器
 * requestClient.addResponseInterceptor(...);
 * ```
 *
 * @path comm\effects\request\src\shared-client.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient, RequestClientOptions } from './request-client';

import { createRequestClient } from './request-client/create-request-client';

/** 共享请求客户端（业务主链路，可注册鉴权/错误提示等拦截器） */
let _requestClient: null | RequestClient = null;

/** 基础请求客户端（不挂业务拦截器，用于 token 刷新/拉取字典等内部请求） */
let _baseRequestClient: null | RequestClient = null;

/**
 * 初始化共享请求客户端。
 *
 * <p>应在应用启动早期（获取 baseURL 后）调用一次；重复调用将忽略。
 *
 * @param config - 客户端创建配置
 */
export function initSharedRequest(config: {
  baseURL: string;
  options?: Record<string, unknown>;
}): void {
  if (_requestClient) return;
  const client = createRequestClient(config as { baseURL: string; options?: RequestClientOptions });
  _requestClient = client.requestClient;
  _baseRequestClient = client.baseRequestClient;
}

/**
 * 获取共享的 requestClient 实例（自动惰性初始化）。
 *
 * @returns 共享请求客户端
 */
export function getRequestClient(): RequestClient {
  if (!_requestClient) {
    const client = createRequestClient({
      baseURL: import.meta.env?.VITE_API_BASE_URL || '/api',
    } as { baseURL: string; options?: RequestClientOptions });
    _requestClient = client.requestClient;
    _baseRequestClient = client.baseRequestClient;
  }
  return _requestClient;
}

/**
 * 获取共享的 baseRequestClient（无业务拦截器）。
 *
 * @returns 基础请求客户端
 */
export function getBaseRequestClient(): RequestClient {
  if (!_baseRequestClient) {
    const client = createRequestClient({
      baseURL: import.meta.env?.VITE_API_BASE_URL || '/api',
    } as { baseURL: string; options?: RequestClientOptions });
    _requestClient = client.requestClient;
    _baseRequestClient = client.baseRequestClient;
  }
  return _baseRequestClient;
}

/**
 * requestClient 代理 —— 懒初始化 + 自动回退。
 *
 * <p>首次属性访问时若 {@link initSharedRequest} 尚未调用，
 * 将以默认 baseURL 自动创建实例，避免拦截器注册时序问题。
 */
export const requestClient: RequestClient = new Proxy(
  {} as RequestClient,
  {
    get(_target, prop) {
      return getRequestClient()[prop as keyof RequestClient];
    },
    has(_target, prop) {
      return prop in getRequestClient();
    },
    set(_target, prop, value) {
      getRequestClient()[prop as keyof RequestClient] = value as never;
      return true;
    },
  },
);

export type { RequestClient };
