/**
 * 拦截器的增删管理：给 axios 原生拦截器补上「可移除」这一环。
 *
 * axios 的 `interceptors.*.use()` 会返回 ID，但业务侧常随手丢弃，
 * 导致多实例 / HMR / 测试场景下拦截器被重复注册（同一条鉴权逻辑执行多次、
 * 错误提示弹两遍）。这里统一保管 ID 并暴露成对的方法，
 * 使「谁注册谁负责移除」成为可执行的约定。
 *
 * 另提供默认配置：只传 `fulfilled` 时，`rejected` 自动补为
 * 直接 reject，避免业务方漏传后错误被静默吞掉。
 *
 * @path comm\effects\request\src\request-client\modules\interceptor.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { AxiosInstance, AxiosResponse } from 'axios';

import type {
  RequestInterceptorConfig,
  ResponseInterceptorConfig,
} from '../types';

const defaultRequestInterceptorConfig: RequestInterceptorConfig = {
  fulfilled: (response) => response,
  rejected: (error) => Promise.reject(error),
};

const defaultResponseInterceptorConfig: ResponseInterceptorConfig = {
  fulfilled: (response: AxiosResponse) => response,
  rejected: (error) => Promise.reject(error),
};

class InterceptorManager {
  private axiosInstance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.axiosInstance = instance;
  }

  /**
   * 添加请求拦截器
   * @returns 拦截器 ID，可用于后续移除
   */
  addRequestInterceptor({
    fulfilled,
    rejected,
  }: RequestInterceptorConfig = defaultRequestInterceptorConfig): number {
    return this.axiosInstance.interceptors.request.use(fulfilled, rejected);
  }

  /**
   * 添加响应拦截器
   * @returns 拦截器 ID，可用于后续移除
   */
  addResponseInterceptor<T = unknown>({
    fulfilled,
    rejected,
  }: ResponseInterceptorConfig<T> = defaultResponseInterceptorConfig): number {
    return this.axiosInstance.interceptors.response.use(fulfilled, rejected);
  }

  /**
   * 移除请求拦截器
   * @param id 拦截器 ID
   */
  removeRequestInterceptor(id: number): void {
    this.axiosInstance.interceptors.request.eject(id);
  }

  /**
   * 移除响应拦截器
   * @param id 拦截器 ID
   */
  removeResponseInterceptor(id: number): void {
    this.axiosInstance.interceptors.response.eject(id);
  }
}

export { InterceptorManager };
