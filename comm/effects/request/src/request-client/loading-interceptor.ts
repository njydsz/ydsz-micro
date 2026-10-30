/**
 * loading 拦截器工厂 —— 通过计数驱动全局 LoadingProvider 显隐
 *
 * 设计要点：
 * - 不直接 import stores 模块，通过回调注入 startLoading/stopLoading，
 *   避免 request ↔ stores 循环依赖；
 * - 以 `method:url` 作为请求唯一键写入 config.requestKey，
 *   响应/错误拦截器读取同一 key 精确抵消，同一请求的多次重试不重复计数；
 * - 忽略被主动取消的请求（AbortController / axios cancel）。
 *
 * @path comm\effects\request\src\request-client\loading-interceptor.ts
 * @author ydsz-team
 * @since 5.2.0
 */

import type { RequestInterceptorConfig, ResponseInterceptorConfig } from './types';

import type { InternalAxiosRequestConfig } from 'axios';

/** 扩展的 Axios 请求配置（含 requestKey） */
type ExtendedRequestConfig = InternalAxiosRequestConfig & {
  /** 请求唯一标识（method:url），拦截器间传递 */
  requestKey?: string;
};

/** 注入的 loading 回调接口 */
export interface LoadingCallbacks {
  /** 标记请求开始，requestKey = `${method}:${url}` */
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
      const method = (config.method ?? 'get').toUpperCase();
      const url = config.url ?? '';
      const requestKey = `${method}:${url}`;

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
