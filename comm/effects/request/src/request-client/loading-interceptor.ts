/**
 * loading 拦截器工厂 —— 通过计数驱动全局 LoadingProvider 显隐
 *
 * 设计要点：
 * - 不直接 import stores 模块，通过回调注入 startLoading/stopLoading，
 *   避免 request ↔ stores 循环依赖；
 * - v4.5 P0-2: 使用唯一请求 ID（基于 config 对象引用）而非 `method:url`，
 *   确保同 URL 并发请求独立计数，避免提前关闭 loading；
 * - 忽略被主动取消的请求（AbortController / axios cancel）。
 *
 * @path comm\effects\request\src\request-client\loading-interceptor.ts
 * @author ydsz-team
 * @since 5.2.0
 */

import type { RequestInterceptorConfig, ResponseInterceptorConfig } from './types';

import type { InternalAxiosRequestConfig } from 'axios';

/** 请求 ID 弱映射表（config 对象 → 唯一 ID） */
const requestIds = new WeakMap<object, string>();

/** 递增计数器（用于生成唯一请求 ID） */
let requestCounter = 0;

/** 扩展的 Axios 请求配置（含 requestKey） */
type ExtendedRequestConfig = InternalAxiosRequestConfig & {
  /** 请求唯一标识（基于 config 对象引用的唯一 ID） */
  requestKey?: string;
};

/**
 * 获取或生成请求唯一 ID
 *
 * 使用 WeakMap 存储 config → id 映射，确保同一 config 对象多次重试使用相同 ID，
 * 不同 config 对象（即使 URL 相同）获得不同 ID。
 */
function getRequestId(config: object): string {
  const existing = requestIds.get(config);
  if (existing) return existing;
  requestCounter += 1;
  const id = `req-${requestCounter}`;
  requestIds.set(config, id);
  return id;
}

/** 注入的 loading 回调接口 */
export interface LoadingCallbacks {
  /** 标记请求开始，requestKey 为唯一请求 ID */
  startLoading: (requestKey: string) => void;
  /** 标记结束 */
  stopLoading: (requestKey: string) => void;
}

/**
 * 创建 loading 拦截器对（request + response）。
 *
 * 调用方在组装拦截器时传入 {@link LoadingCallbacks}，
 * 由上层（如 main/src/api/request.ts）注入 useLoadingStore 的 start/stop 方法，
 * 从而切断 request → stores 的编译期依赖。
 *
 * @param callbacks - 上层注入的 loading 操作回调
 * @returns [requestInterceptor, responseInterceptor]
 */
export function createLoadingInterceptors(
  callbacks: LoadingCallbacks,
): [RequestInterceptorConfig, ResponseInterceptorConfig] {
  const { startLoading, stopLoading } = callbacks;

  const requestInterceptor: RequestInterceptorConfig = {
    fulfilled: (config) => {
      // v4.5 P0-2: 使用唯一请求 ID，确保同 URL 并发请求独立计数
      const requestKey = getRequestId(config);

      // 写入 config，响应/错误拦截器读取同一 key
      (config as ExtendedRequestConfig).requestKey = requestKey;

      startLoading(requestKey);
      return config;
    },
  };

  const responseInterceptor: ResponseInterceptorConfig = {
    fulfilled: (response) => {
      const requestKey = (response.config as ExtendedRequestConfig)?.requestKey;
      if (requestKey) {
        stopLoading(requestKey);
      }
      return response;
    },
    rejected: (error: unknown) => {
      // 从 error 对象提取 config（axios 错误必有 config）
      const axiosError = error as { config?: ExtendedRequestConfig };
      const requestKey = axiosError.config?.requestKey;
      if (requestKey) {
        stopLoading(requestKey);
      }
      throw error;
    },
  };

  return [requestInterceptor, responseInterceptor];
}
