/**
 * 与后端响应契约对齐的预置拦截器。
 *
 * 承载四套应用共用的响应处理约定，业务侧无需重复实现：
 * - 业务码判定与数据剥离：按 `code` / `successCode` 判定成功，
 *   直接返回 `data` 字段，失败则抛 `BusinessError`；
 * - 401 自动刷新 token 并重放请求，刷新期间并发请求排队而非各自刷新；
 * - 错误消息国际化与统一提示。
 *
 * 独立成文件是为了让「契约适配」与「通用传输能力」分离：
 * `request-client.ts` 只管发请求，后端信封格式的变化应只改这里。
 *
 * @path comm\effects\request\src\request-client\preset-interceptors.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient } from './request-client';
import type { MakeErrorMessageFn, ResponseInterceptorConfig } from './types';

import { $t } from '@ydsz/locales';
import { isFunction } from '@ydsz/utils';

import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { RequestResponse } from './types';

import { BusinessError } from './business-error';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('preset-interceptors');

/** 响应数据类型（未知结构） */
type UnknownResponse = Record<string, unknown>;

/** 可调用的 successCode 类型 */
type SuccessCodeFn = (code: unknown) => boolean;

/** 可调用的 dataField 类型 */
type DataFieldFn = (response: UnknownResponse) => unknown;

/** 扩展的 Axios 请求配置（含自定义字段） */
type ExtendedAxiosRequestConfig = InternalAxiosRequestConfig & {
  __isRetryRequest?: boolean;
  /** 当前请求已重试次数 */
  __retryCount?: number;
};

/** 类型守卫：判断是否为 successCode 函数 */
function isSuccessCodeFn(value: unknown): value is SuccessCodeFn {
  return isFunction(value);
}

/** 类型守卫：判断是否为 dataField 函数 */
function isDataFieldFn(value: unknown): value is DataFieldFn {
  return isFunction(value);
}

/** 默认响应拦截器：按 codeField/successCode 判定业务成功，剥离 dataField 数据或抛 BusinessError */
export const defaultResponseInterceptor = ({
  codeField = 'code',
  dataField = 'data',
  successCode = 0,
}: {
  /** 响应数据中代表访问结果的字段名 */
  codeField: string;
  /** 响应数据中装载实际数据的字段名，或者提供一个函数从响应数据中解析需要返回的数据 */
  dataField: DataFieldFn | string;
  /** 当codeField所指定的字段值与successCode相同时，代表接口访问成功。如果提供一个函数，则返回true代表接口访问成功 */
  successCode: SuccessCodeFn | number | string;
}): ResponseInterceptorConfig => {
  return {
    fulfilled: (response) => {
      const { config, data, status } = response;
      const responseData = data as UnknownResponse;

      if (config.responseReturn === 'raw') {
        return response as unknown as RequestResponse;
      }

      if (status >= 200 && status < 400) {
        if (config.responseReturn === 'body') {
          return responseData as unknown as RequestResponse;
        } else if (
          isSuccessCodeFn(successCode)
            ? successCode(responseData[codeField])
            : responseData[codeField] === successCode
        ) {
          const result = isDataFieldFn(dataField)
            ? dataField(responseData)
            : responseData[dataField];
          return result as unknown as RequestResponse;
        }
      }
      throw new BusinessError(
        (responseData?.message as string) || '业务请求失败',
        {
          code: responseData?.[codeField] as string | undefined,
          data: responseData,
          statusCode: status,
        },
      );
    },
  };
};

/**
 * 创建「401 自动刷新 token 并重放请求」的响应拦截器。
 *
 * @remarks
 * 处理流程：
 * 1. 非 401 错误原样抛出，不做任何干预；
 * 2. 未开启 refreshToken，或该请求已是重试请求（`config.__isRetryRequest`）时，
 *    直接走重新登录并抛出原错误——`__isRetryRequest` 是防止「刷新后仍 401」造成无限重试的关键开关；
 * 3. 若已有刷新在途（`client.isRefreshing`），当前请求挂入 `refreshTokenQueue` 排队，
 *    刷新成功后用新 token 重放，保证并发 401 只触发**一次**刷新；
 * 4. 否则由本请求发起刷新，成功后先唤醒队列再重放自身。
 *
 * 失败与副作用：刷新失败时会 reject 队列中所有等待请求、清空队列、执行 `doReAuthenticate`
 * （通常是跳转登录页）并抛出刷新错误；无论成败 `finally` 中都会复位 `isRefreshing`，
 * 避免刷新标记泄漏导致后续请求永久排队。
 *
 * 注意：拦截器直接读写 `client.isRefreshing` 与 `client.refreshTokenQueue`，
 * 与传入的 `client` 强耦合，请勿在多个 client 之间共享同一个拦截器实例。
 *
 * @param options - 拦截器依赖项
 * @param options.client - 该拦截器所属的请求客户端，用于共享刷新状态与重放请求
 * @param options.doReAuthenticate - 重新认证回调，通常清理登录态并跳转登录页
 * @param options.doRefreshToken - 刷新 token 回调，需返回新的 token 字符串；返回 null 表示刷新失败（如 refreshToken 缺失），将触发重新认证
 * @param options.enableRefreshToken - 是否启用无感刷新；为 false 时 401 直接走重新认证
 * @param options.formatToken - 把 token 格式化为 Authorization 头的值（如加 `Bearer ` 前缀）
 * @returns 可注册到请求客户端的响应拦截器配置（仅含 `rejected` 分支）
 */
export const authenticateResponseInterceptor = ({
  client,
  doReAuthenticate,
  doRefreshToken,
  enableRefreshToken,
  formatToken,
}: {
  client: RequestClient;
  doReAuthenticate: () => Promise<void>;
  doRefreshToken: () => Promise<null | string>;
  enableRefreshToken: boolean;
  formatToken: (token: string) => null | string;
}): ResponseInterceptorConfig => {
  return {
    rejected: async (error: unknown) => {
      const axiosError = error as AxiosError;
      const config = axiosError.config as ExtendedAxiosRequestConfig | undefined;
      const { response } = axiosError;
      // 如果不是 401 错误，直接抛出异常
      if (response?.status !== 401) {
        throw error;
      }
      // 判断是否启用了 refreshToken 功能
      // 如果没有启用或者已经是重试请求了，直接跳转到重新登录
      if (!enableRefreshToken || config?.__isRetryRequest) {
        await doReAuthenticate();
        throw error;
      }
      // 如果正在刷新 token，则将请求加入队列，等待刷新完成
      if (client.isRefreshing) {
        return new Promise((resolve, reject) => {
          client.refreshTokenQueue.push({
            resolve: (newToken: string) => {
              if (config?.headers) {
                config.headers.Authorization = formatToken(newToken);
              }
              resolve(client.request(config?.url ?? '', { ...config }));
            },
            reject: (error: unknown) => {
              reject(error);
            },
          });
        });
      }

      // 标记开始刷新 token
      client.isRefreshing = true;
      // 标记当前请求为重试请求，避免无限循环
      if (config) {
        config.__isRetryRequest = true;
      }

      try {
        const newToken = await doRefreshToken();

        // 刷新失败（如 refreshToken 缺失）：拒绝队列并走重新认证
        if (!newToken) {
          client.refreshTokenQueue.forEach((cb) => cb.reject(new Error('Refresh token unavailable')));
          client.refreshTokenQueue = [];
          await doReAuthenticate();
          throw new Error('Refresh token unavailable, please login again.');
        }

        // 处理队列中的请求
        client.refreshTokenQueue.forEach((callback) => callback.resolve(newToken));
        // 清空队列
        client.refreshTokenQueue = [];

        return client.request(axiosError.config?.url ?? '', { ...axiosError.config });
      } catch (refreshError) {
        // 如果刷新 token 失败，拒绝队列中所有等待的请求
        client.refreshTokenQueue.forEach((callback) => callback.reject(refreshError));
        client.refreshTokenQueue = [];
        logger.error('Refresh token failed, please login again.');
        await doReAuthenticate();

        throw refreshError;
      } finally {
        client.isRefreshing = false;
      }
    },
  };
};

/**
 * 创建「把请求错误翻译成用户可读提示」的响应拦截器。
 *
 * @remarks
 * 判定顺序：先识别主动取消的请求（`axios.isCancel`）并**静默透传**，不弹提示；
 * 再识别网络异常与超时；最后按 HTTP 状态码映射国际化文案，未命中的状态码统一归为服务端错误。
 *
 * 行为约定：本拦截器**只负责提示、不吞异常**——所有分支最终都会
 * `Promise.reject(error)` 把原始错误继续向上抛，业务侧仍可自行 catch 做补偿处理。
 * 提示的实际呈现方式（Message / Notification / 静默上报）由 `makeErrorMessage` 决定，
 * 未传时只做错误透传，不产生任何 UI 反馈。
 *
 * 注意：401 在这里也会产生提示文案，若同时启用了
 * {@link authenticateResponseInterceptor}，需注意拦截器注册顺序以免出现重复提示。
 *
 * @param makeErrorMessage - 展示错误提示的回调，接收本地化后的文案与原始错误对象；省略则不提示
 * @returns 可注册到请求客户端的响应拦截器配置（仅含 `rejected` 分支）
 */
export const errorMessageResponseInterceptor = (
  makeErrorMessage?: MakeErrorMessageFn,
): ResponseInterceptorConfig => {
  return {
    // 非标准 API 收窄：axios 错误类型为 AxiosError，但为兼容未知错误源使用 unknown
    rejected: (error: unknown) => {
      const axiosError = error as AxiosError;
      if (axios.isCancel(axiosError)) {
        return Promise.reject(axiosError);
      }

      const err: string = axiosError?.toString?.() ?? '';
      let errMsg = '';
      if (err?.includes('Network Error')) {
        errMsg = $t('ui.fallback.http.networkError');
      } else if (axiosError?.message?.includes?.('timeout')) {
        errMsg = $t('ui.fallback.http.requestTimeout');
      }
      if (errMsg) {
        makeErrorMessage?.(errMsg, axiosError);
        return Promise.reject(axiosError);
      }

      let errorMessage = '';
      const status = axiosError?.response?.status;

      switch (status) {
        case 400: {
          errorMessage = $t('ui.fallback.http.badRequest');
          break;
        }
        case 401: {
          errorMessage = $t('ui.fallback.http.unauthorized');
          break;
        }
        case 403: {
          errorMessage = $t('ui.fallback.http.forbidden');
          break;
        }
        case 404: {
          errorMessage = $t('ui.fallback.http.notFound');
          break;
        }
        case 408: {
          errorMessage = $t('ui.fallback.http.requestTimeout');
          break;
        }
        case 502: {
          errorMessage = $t('ui.fallback.http.badGateway');
          break;
        }
        case 503: {
          errorMessage = $t('ui.fallback.http.serviceUnavailable');
          break;
        }
        case 504: {
          errorMessage = $t('ui.fallback.http.gatewayTimeout');
          break;
        }
        default: {
          // 兜底：所有其他状态码统一返回服务器错误提示
          errorMessage = $t('ui.fallback.http.internalServerError');
          break;
        }
      }
      makeErrorMessage?.(errorMessage, axiosError);
      return Promise.reject(axiosError);
    },
  };
};

/**
 * 创建「自动重试」响应拦截器 —— 基于错误码元信息 (retryable) 和 HTTP 5xx 状态码执行退避重试。
 *
 * <p>重试判定逻辑（满足任一即触发）：
 * <ol>
 *   <li>错误为 {@link BusinessError} 且 {@link BusinessError.retryable} = true（后端显式标记可重试）</li>
 *   <li>HTTP 状态码为 5xx（服务端瞬时故障）</li>
 * </ol>
 *
 * <p>退避策略：指数退避 + 随机抖动，公式：{@code delay = min(baseDelay * 2^retryCount + jitter, maxDelay)}。
 *
 * <p>注意事项：
 * - 本拦截器必须在 {@link errorMessageResponseInterceptor} **之前**注册，避免重试过程触发冗余错误提示。
 * - 401 / 认证错误由 {@link authenticateResponseInterceptor} 接管，不参与本拦截器重试。
 * - 最大重试次数默认 3 次，超过后抛出原始错误。
 * - GET/HEAD/OPTIONS 请求默认启用重试；写请求（POST/PUT/PATCH/DELETE）需显式配置 {@code retryable: true}。
 *
 * @param options - 重试配置
 * @param options.client - 请求客户端实例（用于重新发起请求）
 * @param options.maxRetries - 最大重试次数，默认 3
 * @param options.baseDelay - 基础延迟（毫秒），默认 1000
 * @param options.maxDelay - 最大延迟（毫秒），默认 10000
 * @param options.jitter - 随机抖动范围（毫秒），默认 300
 * @param options.onRetry - 重试命中回调（可选，用于监控上报）
 * @returns 可注册到请求客户端的响应拦截器配置（仅含 `rejected` 分支）
 */
/**
 * 创建「自动重试」响应拦截器 —— 基于错误码元信息 (retryable) 和 HTTP 5xx 状态码执行退避重试。
 *
 * <p>重试判定逻辑（满足任一即触发）：
 * <ol>
 *   <li>错误为 {@link BusinessError} 且 {@link BusinessError.retryable} = true（后端显式标记可重试）</li>
 *   <li>HTTP 状态码为 5xx（服务端瞬时故障）</li>
 * </ol>
 *
 * <p>退避策略：指数退避 + 随机抖动，公式：{@code delay = min(baseDelay * 2^retryCount + jitter, maxDelay)}。
 *
 * <p>注意事项：
 * - 本拦截器必须在 {@link errorMessageResponseInterceptor} **之前**注册，避免重试过程触发冗余错误提示。
 * - 401 / 认证错误由 {@link authenticateResponseInterceptor} 接管，不参与本拦截器重试。
 * - 最大重试次数默认 3 次，超过后抛出原始错误。
 * - 重入方式为 axios 实例级 re-dispatch（instance.request），不经过 RequestClient.request() 的内置重试逻辑。
 *
 * @param options - 重试配置
 * @param options.axiosInstance - 客户端内部的 axios 实例（用于 re-dispatch，避免进入 RequestClient.request 的内置重试）
 * @param options.maxRetries - 最大重试次数，默认 3
 * @param options.baseDelay - 基础延迟（毫秒），默认 1000
 * @param options.maxDelay - 最大延迟（毫秒），默认 10000
 * @param options.jitter - 随机抖动范围（毫秒），默认 300
 * @param options.onRetry - 重试命中回调（可选，用于监控上报）
 * @returns 可注册到请求客户端的响应拦截器配置（仅含 `rejected` 分支）
 */
export const retryResponseInterceptor = ({
  axiosInstance,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
  jitter = 300,
  onRetry,
}: {
  axiosInstance: AxiosInstance;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: number;
  onRetry?: (info: { url: string; retryCount: number; error: unknown }) => void;
}): ResponseInterceptorConfig => {
  return {
    rejected: async (error: unknown) => {
      const axiosError = error as AxiosError;
      const config = axiosError.config as ExtendedAxiosRequestConfig | undefined;

      // 无配置信息（如请求被拦截器构造失败），不参与重试
      if (!config) {
        throw error;
      }

      const retryCount = config.__retryCount ?? 0;

      // 超过最大重试次数，抛出原始错误
      if (retryCount >= maxRetries) {
        throw error;
      }

      // 判断是否需要重试
      let shouldRetry = false;

      // 条件 1：BusinessError 显式标记 retryable
      if (error instanceof BusinessError && error.retryable) {
        shouldRetry = true;
      }

      // 条件 2：HTTP 5xx 状态码（服务端瞬时故障）
      const status = axiosError?.response?.status;
      if (status && status >= 500 && status < 600) {
        shouldRetry = true;
      }

      // 条件 3：网络错误（无响应）且请求方法幂等
      if (!axiosError.response) {
        const method = (config.method ?? 'get').toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
          shouldRetry = true;
        }
      }

      if (!shouldRetry) {
        throw error;
      }

      // 递增重试计数
      config.__retryCount = retryCount + 1;
      config.__isRetryRequest = true;

      // 计算退避延迟
      const exponentialDelay = baseDelay * Math.pow(2, retryCount);
      const jitterMs = Math.floor(Math.random() * jitter);
      const delay = Math.min(exponentialDelay + jitterMs, maxDelay);

      logger.debug(`请求重试 (${config.__retryCount}/${maxRetries})，${delay}ms 后重放: ${config.url}`);

      // 监控回调
      onRetry?.({
        url: config.url ?? '',
        retryCount: config.__retryCount,
        error,
      });

      // 执行退避等待
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 通过 axios 实例级 request 重入拦截器链（不触发 RequestClient 内置重试配置）
      return axiosInstance.request(config);
    },
  };
};

/**
 * 已提示退役的接口缓存（URL + 版本标识去重，避免同一接口重复刷屏）
 */
const deprecationWarned = new Set<string>();

/**
 * 创建「API 版本退役提示」响应拦截器（P1-版本协商闭环，2026-09-01）
 *
 * <p>后端 ApiVersionHeaderFilter 按 RFC 8594 下发：
 *
 * <ul>
 *   <li>{@code Deprecation}：接口已标记退役（值为时间戳或版本描述）
 *   <li>{@code Sunset}：计划下线时间（HTTP 日期）
 * </ul>
 *
 * <p>本拦截器必须在 {@link defaultResponseInterceptor} 之前注册 ——
 * 后者会把响应剥离为纯 data，响应头信息随之丢失。
 *
 * <p>默认行为：控制台告警（按 URL + Deprecation 值去重），并通过
 * {@code onDeprecated} 回调暴露给监控/埋点，不阻断请求流程。
 *
 * @param options.onDeprecated 退役接口命中回调（可选，用于上报监控）
 * @returns 响应拦截器配置
 */
export const deprecationNoticeInterceptor = (options: {
  onDeprecated?: (info: { sunset: string; url: string; version: string }) => void;
} = {}): ResponseInterceptorConfig => {
  return {
    fulfilled: (response) => {
      // axios 将响应头键统一小写
      const headers = (response as { headers?: Record<string, unknown> })?.headers ?? {};
      const version = String(headers['deprecation'] ?? '').trim();
      const sunset = String(headers['sunset'] ?? '').trim();

      if (!version && !sunset) {
        return response;
      }

      const url = response?.config?.url ?? 'unknown';
      const dedupeKey = `${url}#${version}`;
      if (!deprecationWarned.has(dedupeKey)) {
        deprecationWarned.add(dedupeKey);
        const sunsetTip = sunset ? `，计划下线时间: ${sunset}` : '';
        logger.warn(`接口 ${url} 已标记退役（Deprecation: ${version || 'true'}${sunsetTip}），请尽快迁移`);
        options.onDeprecated?.({ sunset, url, version });
      }
      return response;
    },
  };
};
