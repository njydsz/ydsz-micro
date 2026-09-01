/**
 * 请求客户端的成对创建工厂。
 *
 * 一次调用返回**两个**客户端实例，这是本模块存在的唯一理由：
 * - `requestClient` —— 业务主链路，各应用在其上注册鉴权、错误提示、401 跳转等拦截器；
 * - `baseRequestClient` —— 不挂任何业务拦截器的「干净」实例。
 *
  * 拆成两个是为了打破循环依赖：刷新 token、拉取字典、上报日志这类请求
 * 本身属于拦截器链路的一部分，若复用 `requestClient`，一旦 token 过期就会
 * 触发拦截器再次尝试刷新，形成递归。`baseRequestClient` 提供了一条
 * 不经过业务拦截器的逃生通道。
 *
 * @path comm\effects\request\src\request-client\create-request-client.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient, RequestClientOptions } from './request-client';

/**
 * 创建请求客户端的配置选项
 */
export interface CreateRequestClientOptions {
  /** API 基础路径 */
  baseURL: string;
  /** 额外的 RequestClient 配置 */
  options?: RequestClientOptions;
}

/**
 * 创建请求客户端工厂函数
 * @description 提取四套应用共享的请求客户端创建逻辑，各应用在此基础上自行注册拦截器
 * @param config 创建配置
 * @returns 请求客户端实例和基础请求客户端实例
 */
export function createRequestClient(
  config: CreateRequestClientOptions,
): {
  baseRequestClient: RequestClient;
  requestClient: RequestClient;
} {
  const { baseURL, options = {} } = config;

  const client = new RequestClient({
    ...options,
    baseURL,
  });

  const baseRequestClient = new RequestClient({
    ...options,
    baseURL,
  });

  return {
    baseRequestClient,
    requestClient: client,
  };
}
