/**
 * RequestClient 公共类型定义（配置、拦截器、响应数据类型）
 *
 * @path comm\effects\request\src\request-client\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';

type ExtendOptions<T = unknown> = {
  /**
   * 参数序列化方式。预置的有
   * - brackets: ids[]=1&ids[]=2&ids[]=3
   * - comma: ids=1,2,3
   * - indices: ids[0]=1&ids[1]=2&ids[2]=3
   * - repeat: ids=1&ids=2&ids=3
   */
  paramsSerializer?:
    | 'brackets'
    | 'comma'
    | 'indices'
    | 'repeat'
    | AxiosRequestConfig<T>['paramsSerializer'];
  /**
   * 响应数据的返回方式。
   * - raw: 原始的AxiosResponse，包括headers、status等，不做是否成功请求的检查。
   * - body: 返回响应数据的BODY部分（只会根据status检查请求是否成功，忽略对code的判断，这种情况下应由调用方检查请求是否成功）。
   * - data: 解构响应的BODY数据，只返回其中的data节点数据（会检查status和code是否为成功状态）。
   */
  responseReturn?: 'body' | 'data' | 'raw';
  /** 请求去重控制（P1-7：in-flight request dedup） */
  dedup?: boolean;
  /**
   * 内置重试配置。
   *
   * @default undefined（即 retryCount = 0，内置重试关闭）
   *
   * @remarks
   * 内置重试在 {@link RequestClient.request} 的 for 循环内执行，
   * 由 `retryCondition(error)` 决定是否触发。默认 `retryCondition` 恒返回 `false`，
   * 因此<strong>仅当显式配置 `retryCondition`</strong> 时才会有重试行为。
   *
   * @warning 请确保与 {@link retryResponseInterceptor}（拦截器级重试）<strong>不会同时启用</strong>。
   *          若同时启用，拦截器在 axios 实例层级的重试结束后抛出的错误，
   *          仍可能被本内置重试再次捕获，导致<strong>重试策略叠加</strong>（实际重试次数 = 二者之积）。
   *
   * @example 推荐做法
   * ```ts
   * // ✅ 只用拦截器重试（推荐）
   * const client = new RequestClient(); // 不传 retry
   * client.addResponseInterceptor(retryResponseInterceptor({ axiosInstance: client.instance }));
   *
   * // ✅ 只用内置重试（简单场景，无拦截器）
   * const client = new RequestClient({
   *   retry: { retryCount: 3, retryCondition: () => true }
   * });
   *
   * // ❌ 双重重试：同时配置两者
   * const client = new RequestClient({
   *   retry: { retryCount: 3, retryCondition: () => true }
   * });
   * client.addResponseInterceptor(retryResponseInterceptor({ axiosInstance: client.instance }));
   * ```
   */
  retry?: {
    /** 最大重试次数，默认 0（不重试） */
    retryCount?: number;
    /** 重试延迟（毫秒），默认 1000 */
    retryDelay?: number;
    /**
     * 重试条件判断函数，返回 true 时触发重试。
     * 默认 `() => false`（永不错失重试），需显式配置才有重试行为。
     */
    retryCondition?: (error: unknown) => boolean;
    /** 退避策略：'fixed'（固定延迟）| 'exponential'（指数退避），默认 fixed */
    retryBackoff?: 'exponential' | 'fixed';
    /** 随机抖动范围（毫秒），仅 exponential 模式生效，默认 0 */
    retryJitter?: number;
  };
};
type RequestClientConfig<T = unknown> = AxiosRequestConfig<T> & ExtendOptions<T>;

type RequestResponse<T = unknown> = AxiosResponse<T> & {
  config: RequestClientConfig<T>;
};

type RequestContentType =
  | 'application/json;charset=utf-8'
  | 'application/octet-stream;charset=utf-8'
  | 'application/x-www-form-urlencoded;charset=utf-8'
  | 'multipart/form-data;charset=utf-8';

type RequestClientOptions = CreateAxiosDefaults & ExtendOptions;

interface RequestInterceptorConfig {
  fulfilled?: (
    config: ExtendOptions & InternalAxiosRequestConfig,
  ) =>
    | (ExtendOptions & InternalAxiosRequestConfig)
    | Promise<ExtendOptions & InternalAxiosRequestConfig>;
  rejected?: (error: unknown) => unknown;
}

interface ResponseInterceptorConfig<T = unknown> {
  fulfilled?: (
    response: RequestResponse<T>,
  ) => Promise<RequestResponse> | RequestResponse;
  rejected?: (error: unknown) => unknown;
}

type MakeErrorMessageFn = (message: string, error: unknown, level?: ExceptionSeverity) => void;

/**
 * 异常级别（驱动前端差异化展示）
 *
 * <p>与后端 {@code com.njydsz.common.exception.enums.ExceptionLevel} 对齐：
 * <ul>
 *   <li>INFO — 静默处理，不展示 toast</li>
 *   <li>WARN — 轻量 toast（auto-close 3s）</li>
 *   <li>ERROR — toast 需用户点击关闭（默认）</li>
 *   <li>FATAL — Modal 弹窗阻断操作</li>
 * </ul>
 */
type ExceptionSeverity = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface HttpResponse<T = unknown> {
  /**
   * 0 表示成功 其他表示失败
   * 0 means success, others means fail
   */
  code: number;
  data: T;
  message: string;
  /** 异常级别（INFO/WARN/ERROR/FATAL），由后端 ExceptionCode.getLevel() 驱动 */
  level?: ExceptionSeverity;
}

export type {
  ExceptionSeverity,
  HttpResponse,
  MakeErrorMessageFn,
  RequestClientConfig,
  RequestClientOptions,
  RequestContentType,
  RequestInterceptorConfig,
  RequestResponse,
  ResponseInterceptorConfig,
};
