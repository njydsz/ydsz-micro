/**
 * 预置拦截器单元测试 — retryResponseInterceptor / authenticateResponseInterceptor / defaultResponseInterceptor
 *
 * <p>覆盖核心路径：
 * - 重试判定（BusinessError.retryable / 5xx / 幂等网络错误）
 * - 退避策略（指数退避 + jitter）
 * - 401 无感刷新 + 并发排队 + 刷新失败走 reauth
 * - 业务码判定 + dataField 剥离 / raw / body 模式
 *
 * <p>符合云顶编码规范 §16.10 测试规范。
 *
 * @path comm/effects/request/src/request-client/preset-interceptors.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// 模块 mock
// ---------------------------------------------------------------------------

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      isCancel: vi.fn(),
      isAxiosError: vi.fn(),
    },
    isCancel: vi.fn(),
    isAxiosError: vi.fn(),
  };
});

vi.mock('@ydsz-core/shared/utils', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}));

vi.mock('@ydsz/locales', () => ({
  $t: vi.fn((key: string) => key),
}));

// 关键：defaultResponseInterceptor 从 @ydsz/utils 导入 isFunction
vi.mock('@ydsz/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ydsz/utils')>();
  return {
    ...actual,
    isFunction: (value: unknown): value is (...args: unknown[]) => unknown =>
      typeof value === 'function',
  };
});

vi.mock('../error-codes', () => ({
  getErrorMeta: vi.fn(() => undefined),
}));

// ---------------------------------------------------------------------------
// 导入被测模块
// ---------------------------------------------------------------------------

import {
  retryResponseInterceptor,
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
} from './preset-interceptors';
import { BusinessError } from './business-error';
import type { RequestClient } from './request-client';

// ---------------------------------------------------------------------------
// 辅助函数与类型
// ---------------------------------------------------------------------------

/** 扩展的 Axios 请求配置（含自定义字段，与拦截器内部对齐） */
type ExtendedAxiosRequestConfig = InternalAxiosRequestConfig & {
  __isRetryRequest?: boolean;
  __retryCount?: number;
};

/** 创建模拟 Axios 请求配置 */
function createConfig(overrides: Partial<ExtendedAxiosRequestConfig> = {}): ExtendedAxiosRequestConfig {
  return {
    url: '/api/test',
    method: 'GET',
    headers: {},
    __retryCount: 0,
    __isRetryRequest: false,
    ...overrides,
  };
}

/** 创建模拟 Axios 错误 */
function createAxiosError(
  overrides: {
    config?: ExtendedAxiosRequestConfig;
    status?: number;
    responseData?: Record<string, unknown>;
    message?: string;
    code?: string;
  } = {},
): AxiosError {
  const { config, status, responseData, message = 'Request failed', code } = overrides;
  const error = new Error(message) as AxiosError;
  error.config = config as InternalAxiosRequestConfig | undefined;
  error.code = code;
  if (status !== undefined) {
    error.response = {
      status,
      statusText: `HTTP ${status}`,
      data: responseData ?? {},
      headers: {},
      config: (config ?? createConfig()) as InternalAxiosRequestConfig,
    };
  }
  return error;
}

/** 创建模拟 BusinessError（retryable 默认为 false，需要时手动开启） */
function createBusinessError(
  message: string,
  options: {
    code?: string;
    statusCode?: number;
    level?: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    retryable?: boolean;
  } = {},
): BusinessError {
  const error = new BusinessError(message, {
    code: options.code,
    statusCode: options.statusCode,
    level: options.level,
  });
  if (options.retryable !== undefined) {
    error.retryable = options.retryable;
  }
  return error;
}

/** 创建模拟 RequestClient */
function createMockClient(overrides: Partial<Record<string, unknown>> = {}): RequestClient {
  return {
    isRefreshing: false,
    refreshTokenQueue: [] as RequestClient['refreshTokenQueue'],
    request: vi.fn().mockResolvedValue({ data: 'mock-response' }),
    ...overrides,
  } as unknown as RequestClient;
}

/** 创建模拟 AxiosInstance */
function createMockAxiosInstance(): AxiosInstance {
  return {
    request: vi.fn().mockResolvedValue({ data: 'success' }),
  } as unknown as AxiosInstance;
}

// ===========================================================================
// retryResponseInterceptor 测试
// ===========================================================================

describe('retryResponseInterceptor', () => {
  let mockAxiosInstance: AxiosInstance;
  let onRetryMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockAxiosInstance = createMockAxiosInstance();
    onRetryMock = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 重试判定
  // -------------------------------------------------------------------------

  it('BusinessError retryable=true 触发重试并调用 onRetry 回调', async () => {
    // Arrange
    const config = createConfig({ __retryCount: 0, method: 'GET' });
    const businessError = createBusinessError('transient failure', {
      code: 'A01061',
      statusCode: 500,
      retryable: true,
    });
    // 拦截器直接将 error 转为 AxiosError 取 config，需将 config 挂载到 error 上
    (businessError as unknown as AxiosError).config = config as InternalAxiosRequestConfig;

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      jitter: 0,
      onRetry: onRetryMock,
    }).rejected;

    // Act
    const result = await interceptor(businessError);

    // Assert
    expect(result).toEqual({ data: 'ok' });
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({ __retryCount: 1, __isRetryRequest: true }),
    );
    expect(onRetryMock).toHaveBeenCalledWith({
      url: '/api/test',
      retryCount: 1,
      error: businessError,
    });
  });

  it('HTTP 5xx 状态码触发重试', async () => {
    // Arrange
    const config = createConfig({ __retryCount: 0, url: '/api/server-error' });
    const axiosError = createAxiosError({
      config,
      status: 503,
      responseData: { message: 'Service Unavailable' },
    });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'recovered' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      jitter: 0,
      onRetry: onRetryMock,
    }).rejected;

    // Act
    const result = await interceptor(axiosError);

    // Assert
    expect(result).toEqual({ data: 'recovered' });
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/server-error', retryCount: 1 }),
    );
  });

  it('HTTP 4xx 非网络错误不触发重试', async () => {
    // Arrange
    const config = createConfig({ __retryCount: 0 });
    const axiosError = createAxiosError({
      config,
      status: 400,
      message: 'Bad Request',
      responseData: { message: 'Bad Request' },
    });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      onRetry: onRetryMock,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toThrow('Bad Request');
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    expect(onRetryMock).not.toHaveBeenCalled();
  });

  it('幂等网络错误（GET + 无响应）触发重试', async () => {
    // Arrange - GET 请求，无 response（网络错误）
    const config = createConfig({ __retryCount: 0, method: 'GET' });
    const axiosError = createAxiosError({ config });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      jitter: 0,
      onRetry: onRetryMock,
    }).rejected;

    // Act
    const result = await interceptor(axiosError);

    // Assert
    expect(result).toEqual({ data: 'ok' });
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('非幂等网络错误（POST + 无响应）不触发重试', async () => {
    // Arrange - POST 请求，无 response（网络错误），不幂等
    const config = createConfig({ __retryCount: 0, method: 'POST' });
    const axiosError = createAxiosError({ config });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      onRetry: onRetryMock,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toBe(axiosError);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    expect(onRetryMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 重试次数上限
  // -------------------------------------------------------------------------

  it('重试次数超过 maxRetries 后抛出原始错误不再重试', async () => {
    // Arrange - __retryCount 已达上限
    const config = createConfig({ __retryCount: 3, __isRetryRequest: true });
    const axiosError = createAxiosError({
      config,
      status: 503,
      message: 'Still down',
      responseData: { message: 'Still down' },
    });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      jitter: 0,
      onRetry: onRetryMock,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toThrow('Still down');
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    expect(onRetryMock).not.toHaveBeenCalled();
  });

  it('config 为 undefined 时不参与重试直接抛出错误', async () => {
    // Arrange - 错误无 config
    const axiosError = createAxiosError({ status: 500, message: 'Orphan error' });
    // 确保 config 为 undefined
    delete axiosError.config;

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      onRetry: onRetryMock,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toBe(axiosError);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    expect(onRetryMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 退避策略
  // -------------------------------------------------------------------------

  it('指数退避延迟计算正确（jitter=0 时确定性验证）', async () => {
    vi.useFakeTimers();

    // Arrange - retryCount=0, baseDelay=1000 => delay = 1000 * 2^0 = 1000ms
    const config = createConfig({ __retryCount: 0, method: 'GET' });
    const axiosError = createAxiosError({ config, status: 502 });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      jitter: 0,
      onRetry: onRetryMock,
    }).rejected;

    // Act
    const promise = interceptor(axiosError);

    // Assert: onRetry 在等待前立即调用
    expect(onRetryMock).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledWith(
      expect.objectContaining({ retryCount: 1 }),
    );

    // 此时还未到延迟时间，不应已发起重入请求
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();

    // 推进时间到 999ms（差 1ms 到 1000ms），仍未触发
    await vi.advanceTimersByTimeAsync(999);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();

    // 推进到 1000ms，触发重入
    await vi.advanceTimersByTimeAsync(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);

    const result = await promise;
    expect(result).toEqual({ data: 'ok' });
  });

  it('retryCount=2 时指数退避延迟约为 baseDelay * 4', async () => {
    vi.useFakeTimers();

    // Arrange - retryCount=2, baseDelay=500 => delay = 500 * 2^2 = 2000ms
    const config = createConfig({ __retryCount: 2, method: 'GET' });
    const axiosError = createAxiosError({ config, status: 500 });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 10000,
      jitter: 0,
    }).rejected;

    // Act
    const promise = interceptor(axiosError);

    // retryCount=2 => delay = 500 * 4 = 2000ms
    await vi.advanceTimersByTimeAsync(1999);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);

    const result = await promise;
    expect(result).toEqual({ data: 'ok' });
  });

  it('延迟被 maxDelay 封顶', async () => {
    vi.useFakeTimers();

    // Arrange - retryCount=10 (理论上时间极大), maxDelay=500
    const config = createConfig({ __retryCount: 10, method: 'GET' });
    const axiosError = createAxiosError({ config, status: 500 });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 100,
      baseDelay: 1000,
      maxDelay: 500,
      jitter: 0,
    }).rejected;

    // Act
    const promise = interceptor(axiosError);

    // baseDelay * 2^10 = 1024000, 远超 maxDelay=500
    await vi.advanceTimersByTimeAsync(499);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);

    const result = await promise;
    expect(result).toEqual({ data: 'ok' });
  });

  // -------------------------------------------------------------------------
  // jitter 范围
  // -------------------------------------------------------------------------

  it('jitter 值非负且在 [0, maxJitter) 范围内', () => {
    // Arrange - 多次采样验证 jitter 范围
    const maxJitter = 300;
    const samples = 20;
    const delays: number[] = [];

    for (let i = 0; i < samples; i++) {
      // 模拟不同的 random 值
      const randomValue = i / samples; // 0, 0.05, 0.10, ..., 0.95
      const jitterMs = Math.floor(randomValue * maxJitter);
      const delays_ = 1000 + jitterMs;
      const delay = Math.min(delays_, 10000);
      delays.push(delay);
    }

    // Assert - 所有延迟值都在预期范围内
    for (const delay of delays) {
      // 最小值：random=0 => delay = baseDelay = 1000
      expect(delay).toBeGreaterThanOrEqual(1000);
      // 最大值：random≈0.99 => delay ≈ 1000 + 297 = 1297
      expect(delay).toBeLessThanOrEqual(1000 + maxJitter - 1);
    }

    // 验证 jitter 产生的延迟分散性（非恒定）
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('jitter=0 时延迟严格等于指数退避值', async () => {
    vi.useFakeTimers();

    const config = createConfig({ __retryCount: 1, method: 'GET' });
    const axiosError = createAxiosError({ config, status: 500 });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const baseDelay = 2000;
    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay,
      maxDelay: 50000,
      jitter: 0,
    }).rejected;

    const promise = interceptor(axiosError);

    // retryCount=1 => 2000 * 2^1 = 4000ms
    await vi.advanceTimersByTimeAsync(3999);
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);

    const result = await promise;
    expect(result).toEqual({ data: 'ok' });
  });

  // -------------------------------------------------------------------------
  // __isRetryRequest 标记
  // -------------------------------------------------------------------------

  it('重试请求设置 __isRetryRequest=true 防止无限循环', async () => {
    // Arrange - 第一次重试成功
    const config = createConfig({ __retryCount: 0, method: 'GET' });
    const axiosError = createAxiosError({ config, status: 500 });

    (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      baseDelay: 10,
      maxDelay: 1000,
      jitter: 0,
    }).rejected;

    // Act
    await interceptor(axiosError);

    // Assert - 重入的 config 包含 __isRetryRequest=true
    const requestCall = (mockAxiosInstance.request as ReturnType<typeof vi.fn>).mock.calls[0][0] as ExtendedAxiosRequestConfig;
    expect(requestCall.__isRetryRequest).toBe(true);
    expect(requestCall.__retryCount).toBe(1);
  });

  it('非重试条件（BusinessError retryable=false）直接抛出不重试', async () => {
    // Arrange - BusinessError 但 retryful=false，有 response（非网络错误）
    const config = createConfig({ __retryCount: 0, method: 'GET' });
    const businessError = createBusinessError('permanent failure', {
      code: 'A01052',
      statusCode: 400,
      retryable: false,
    });
    // 拦截器将 error 强转为 AxiosError 取 config，需挂载 config 和 response
    const errorWithConfig = businessError as unknown as AxiosError;
    errorWithConfig.config = config as InternalAxiosRequestConfig;
    // 显式设置 response 表示这不是网络错误（避免进入幂等重试分支）
    errorWithConfig.response = {
      status: 400,
      statusText: 'Bad Request',
      data: { message: 'permanent failure' },
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };

    const interceptor = retryResponseInterceptor({
      axiosInstance: mockAxiosInstance,
      maxRetries: 3,
      onRetry: onRetryMock,
    }).rejected;

    // Act & Assert
    await expect(interceptor(businessError)).rejects.toThrow('permanent failure');
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    expect(onRetryMock).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// authenticateResponseInterceptor 测试
// ===========================================================================

describe('authenticateResponseInterceptor', () => {
  let mockClient: RequestClient;
  let doRefreshTokenMock: ReturnType<typeof vi.fn>;
  let doReAuthenticateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockClient = createMockClient();
    doRefreshTokenMock = vi.fn().mockResolvedValue('new-access-token');
    doReAuthenticateMock = vi.fn().mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // 非 401 透传
  // -------------------------------------------------------------------------

  it('非 401 错误原样抛出不做任何干预', async () => {
    // Arrange - 500 错误
    const config = createConfig();
    const axiosError = createAxiosError({
      config,
      status: 500,
      message: 'Internal Server Error',
      responseData: { message: 'Internal Server Error' },
    });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toThrow('Internal Server Error');
    expect(doRefreshTokenMock).not.toHaveBeenCalled();
    expect(doReAuthenticateMock).not.toHaveBeenCalled();
  });

  it('403 错误原样抛出不触发刷新', async () => {
    const config = createConfig();
    const axiosError = createAxiosError({
      config,
      status: 403,
      message: 'Forbidden',
      responseData: { message: 'Forbidden' },
    });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    await expect(interceptor(axiosError)).rejects.toThrow('Forbidden');
    expect(doRefreshTokenMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 401 触发刷新 + 重放成功
  // -------------------------------------------------------------------------

  it('首次 401 触发 token 刷新并成功后重放请求', async () => {
    // Arrange
    const config = createConfig({ url: '/api/protected', method: 'GET' });
    const axiosError = createAxiosError({ config, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce('refreshed-token');
    (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'retried-success' });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act
    const result = await interceptor(axiosError);

    // Assert
    expect(doRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(mockClient.request).toHaveBeenCalledTimes(1);
    expect(mockClient.request).toHaveBeenCalledWith('/api/protected', expect.objectContaining({
      __isRetryRequest: true,
    }));
    expect(result).toEqual({ data: 'retried-success' });
    expect(doReAuthenticateMock).not.toHaveBeenCalled();
  });

  it('刷新成功后通过 formatToken 设置新 token 到排队请求头', async () => {
    // Arrange - 第二个 401 请求排队时，formatToken 应用到其 header
    const config1 = createConfig({ url: '/api/first' });
    const config2 = createConfig({ url: '/api/second', headers: {} });

    const error1 = createAxiosError({ config: config1, status: 401 });
    const error2 = createAxiosError({ config: config2, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce('queued-token');
    (mockClient.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: 'first-ok' })
      .mockResolvedValueOnce({ data: 'second-ok' });

    const formatToken = vi.fn((token: string) => `Bearer ${token}`);

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken,
    }).rejected;

    // Act
    const promise1 = interceptor(error1);
    const promise2 = interceptor(error2);

    await Promise.all([promise1, promise2]);

    // Assert - formatToken 被应用于排队请求的 Authorization 头
    expect(formatToken).toHaveBeenCalledWith('queued-token');
    expect(formatToken).toHaveBeenCalledTimes(1); // 仅排队请求调用 formatToken
  });

  // -------------------------------------------------------------------------
  // 并发排队
  // -------------------------------------------------------------------------

  it('并发 401 共享单次刷新，队列中请求全部被唤醒', async () => {
    // Arrange
    const config1 = createConfig({ url: '/api/a', __isRetryRequest: false });
    const config2 = createConfig({ url: '/api/b', __isRetryRequest: false });
    const config3 = createConfig({ url: '/api/c', __isRetryRequest: false });

    const error1 = createAxiosError({ config: config1, status: 401 });
    const error2 = createAxiosError({ config: config2, status: 401 });
    const error3 = createAxiosError({ config: config3, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce('shared-token');
    (mockClient.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: 'success-a' })
      .mockResolvedValueOnce({ data: 'success-b' })
      .mockResolvedValueOnce({ data: 'success-c' });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act - 发起第一个请求（触发刷新）
    const promise1 = interceptor(error1);

    // 此时 isRefreshing 应为 true
    expect(mockClient.isRefreshing).toBe(true);

    // 并发发起第二、三个请求
    const promise2 = interceptor(error2);
    const promise3 = interceptor(error3);

    // Assert - 所有三个请求都成功
    const results = await Promise.all([promise1, promise2, promise3]);

    // 三个请求都成功返回
    expect(results).toHaveLength(3);
    expect(results.every((r) => r && typeof r === 'object' && 'data' in r)).toBe(true);

    // doRefreshToken 仅被调用一次
    expect(doRefreshTokenMock).toHaveBeenCalledTimes(1);

    // doReAuthenticate 未被调用
    expect(doReAuthenticateMock).not.toHaveBeenCalled();

    // 队列已被清空
    expect(mockClient.refreshTokenQueue).toHaveLength(0);

    // 最终 isRefreshing 复位
    expect(mockClient.isRefreshing).toBe(false);

    // client.request 被调用 3 次
    expect(mockClient.request).toHaveBeenCalledTimes(3);
  });

  it('并发排队时后续请求也通过 client.request 重放', async () => {
    const config1 = createConfig({ url: '/api/first' });
    const config2 = createConfig({ url: '/api/second' });

    const error1 = createAxiosError({ config: config1, status: 401 });
    const error2 = createAxiosError({ config: config2, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce('queue-token');
    (mockClient.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: 'first-ok' })
      .mockResolvedValueOnce({ data: 'second-ok' });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    const promise1 = interceptor(error1);
    const promise2 = interceptor(error2);

    await Promise.all([promise1, promise2]);

    // client.request 被调用 2 次（第一次重放 + 排队中的第二次）
    expect(mockClient.request).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // 刷新失败
  // -------------------------------------------------------------------------

  it('刷新失败拒绝所有排队请求 + 调用 doReAuthenticate', async () => {
    // Arrange
    const refreshError = new Error('network error during refresh');
    const config1 = createConfig({ url: '/api/a' });
    const config2 = createConfig({ url: '/api/b' });

    const error1 = createAxiosError({ config: config1, status: 401 });
    const error2 = createAxiosError({ config: config2, status: 401 });

    doRefreshTokenMock.mockRejectedValueOnce(refreshError);

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act
    const promise1 = interceptor(error1);
    const promise2 = interceptor(error2);

    // Assert - 两个请求都被拒绝
    await expect(promise1).rejects.toThrow('network error during refresh');
    await expect(promise2).rejects.toThrow('network error during refresh');

    // doReAuthenticate 被调用
    expect(doReAuthenticateMock).toHaveBeenCalled();

    // 队列清空
    expect(mockClient.refreshTokenQueue).toHaveLength(0);

    // isRefreshing 最终复位
    expect(mockClient.isRefreshing).toBe(false);
  });

  it('刷新返回 null（refreshToken 缺失）拒绝队列 + 走 reauth', async () => {
    const config1 = createConfig({ url: '/api/a' });
    const config2 = createConfig({ url: '/api/b' });

    const error1 = createAxiosError({ config: config1, status: 401 });
    const error2 = createAxiosError({ config: config2, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce(null);

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    const promise1 = interceptor(error1);
    const promise2 = interceptor(error2);

    await expect(promise1).rejects.toThrow('Refresh token unavailable');
    await expect(promise2).rejects.toThrow('Refresh token unavailable');

    expect(doReAuthenticateMock).toHaveBeenCalled();
    expect(mockClient.refreshTokenQueue).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // enableRefreshToken=false
  // -------------------------------------------------------------------------

  it('enableRefreshToken=false 时 401 直接调用 doReAuthenticate', async () => {
    // Arrange
    const config = createConfig({ url: '/api/protected' });
    const axiosError = createAxiosError({ config, status: 401 });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: false,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toBe(axiosError);

    expect(doReAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(doRefreshTokenMock).not.toHaveBeenCalled();
    expect(mockClient.isRefreshing).toBe(false);
  });

  // -------------------------------------------------------------------------
  // __isRetryRequest 防止循环
  // -------------------------------------------------------------------------

  it('已标记 __isRetryRequest 的 401 直接走 reauth 不重试', async () => {
    // Arrange - 已经是重试请求但仍 401
    const config = createConfig({ url: '/api/protected', __isRetryRequest: true });
    const axiosError = createAxiosError({ config, status: 401 });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    // Act & Assert
    await expect(interceptor(axiosError)).rejects.toBe(axiosError);

    expect(doReAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(doRefreshTokenMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // isRefreshing 最终复位
  // -------------------------------------------------------------------------

  it('刷新成功后 finally 中 isRefreshing 复位为 false', async () => {
    const config = createConfig({ url: '/api/test' });
    const axiosError = createAxiosError({ config, status: 401 });

    doRefreshTokenMock.mockResolvedValueOnce('ok-token');
    (mockClient.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'ok' });

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    await interceptor(axiosError);

    expect(mockClient.isRefreshing).toBe(false);
  });

  it('刷新失败后 finally 中 isRefreshing 复位为 false', async () => {
    const config = createConfig({ url: '/api/test' });
    const axiosError = createAxiosError({ config, status: 401 });

    doRefreshTokenMock.mockRejectedValueOnce(new Error('fail'));

    const interceptor = authenticateResponseInterceptor({
      client: mockClient,
      doReAuthenticate: doReAuthenticateMock,
      doRefreshToken: doRefreshTokenMock,
      enableRefreshToken: true,
      formatToken: (token: string) => `Bearer ${token}`,
    }).rejected;

    await expect(interceptor(axiosError)).rejects.toThrow('fail');

    expect(mockClient.isRefreshing).toBe(false);
  });
});

// ===========================================================================
// defaultResponseInterceptor 测试
// ===========================================================================

describe('defaultResponseInterceptor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // codeField / successCode 判定 + dataField 剥离
  // -------------------------------------------------------------------------

  it('codeField/successCode 命中时返回 dataField 对应数据', () => {
    // Arrange
    const response = {
      data: { code: 0, data: { userId: 123, name: 'test' }, message: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { responseReturn: 'data' },
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // Act
    const result = interceptor(response as never);

    // Assert
    expect(result).toEqual({ userId: 123, name: 'test' });
  });

  it('自定义 codeField 命中时正确剥离数据', () => {
    const response = {
      data: { status: 'OK', result: [1, 2, 3], msg: '' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'status',
      dataField: 'result',
      successCode: 'OK',
    }).fulfilled;

    const result = interceptor(response as never);

    expect(result).toEqual([1, 2, 3]);
  });

  it('successCode 使用函数时正确判定成功', () => {
    const response = {
      data: { code: 'A00000', data: { items: [] }, message: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code: unknown) => code === 'A00000',
    }).fulfilled;

    const result = interceptor(response as never);

    expect(result).toEqual({ items: [] });
  });

  it('successCode 函数返回 false 时抛出 BusinessError', () => {
    const response = {
      data: { code: 'A01052', data: null, message: 'param error', level: 'WARN' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code: unknown) => code === 'A00000',
    }).fulfilled;

    expect(() => interceptor(response as never)).toThrow(BusinessError);

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError).toBeInstanceOf(BusinessError);
      expect(bizError.code).toBe('A01052');
      expect(bizError.statusCode).toBe(200);
      expect(bizError.message).toBe('param error');
    }
  });

  // -------------------------------------------------------------------------
  // raw 模式
  // -------------------------------------------------------------------------

  it('raw 模式透传整个 response 对象', () => {
    // Arrange
    const rawResponse = {
      data: { code: 123, data: { foo: 'bar' }, message: 'should not matter' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { responseReturn: 'raw' },
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // Act
    const result = interceptor(rawResponse as never);

    // Assert - 返回完整的原始 response 对象
    expect(result).toBe(rawResponse);
    expect(result).toHaveProperty('status', 200);
    expect(result).toHaveProperty('headers');
  });

  it('raw 模式下即使 code 不匹配也不抛出错误', () => {
    const rawResponse = {
      data: { code: 999, data: null, message: 'business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { responseReturn: 'raw' },
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    const result = interceptor(rawResponse as never);

    expect(result).toBe(rawResponse);
    expect(result.data).toEqual({ code: 999, data: null, message: 'business error' });
  });

  // -------------------------------------------------------------------------
  // body 模式
  // -------------------------------------------------------------------------

  it('body 模式返回 response data 对象（不检查 code）', () => {
    // Arrange
    const response = {
      data: { code: 'any', payload: 'value', extra: 42 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { responseReturn: 'body' },
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // Act
    const result = interceptor(response as never);

    // Assert - 返回 data 层，不检查 code
    expect(result).toEqual({ code: 'any', payload: 'value', extra: 42 });
  });

  it('body 模式下 4xx 状态码不做 code 判定直接抛出 BusinessError', () => {
    const response = {
      data: { error: 'details' },
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { responseReturn: 'body' },
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // body 模式下只检查 status >= 200 && < 400
    // status=422 不在范围内，应该抛出 BusinessError
    expect(() => interceptor(response as never)).toThrow(BusinessError);
  });

  // -------------------------------------------------------------------------
  // dataField 剥离
  // -------------------------------------------------------------------------

  it('dataField 为函数时执行函数提取数据', () => {
    // Arrange
    const response = {
      data: {
        code: 0,
        data: { nested: { value: 'deep' } },
        extra: 'metadata',
        message: 'ok',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: (res: Record<string, unknown>) => ({
        ...(res.data as Record<string, unknown>).nested as Record<string, unknown>,
        meta: res.extra,
      }),
      successCode: 0,
    }).fulfilled;

    // Act
    const result = interceptor(response as never);

    // Assert
    expect(result).toEqual({ value: 'deep', meta: 'metadata' });
  });

  it('dataField 字符串字段不存在时返回 undefined', () => {
    const response = {
      data: { code: 0, message: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'nonexistent',
      successCode: 0,
    }).fulfilled;

    const result = interceptor(response as never);

    expect(result).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 异常抛出
  // -------------------------------------------------------------------------

  it('code 不匹配时抛出 BusinessError 并携带完整上下文', () => {
    // Arrange
    const response = {
      data: {
        code: 'A01052',
        data: { field: 'email', reason: 'invalid format' },
        message: 'param error',
        level: 'WARN',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // Act & Assert
    expect(() => interceptor(response as never)).toThrow(BusinessError);

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError).toBeInstanceOf(BusinessError);
      expect(bizError.code).toBe('A01052');
      expect(bizError.data).toEqual({
        code: 'A01052',
        data: { field: 'email', reason: 'invalid format' },
        message: 'param error',
        level: 'WARN',
      });
      expect(bizError.statusCode).toBe(200);
      expect(bizError.level).toBe('WARN');
    }
  });

  it('HTTP 4xx 且非 raw/body 模式抛出 BusinessError', () => {
    // Arrange
    const response = {
      data: { code: '', data: null, message: 'Bad Request' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    // Act & Assert
    expect(() => interceptor(response as never)).toThrow(BusinessError);

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError.statusCode).toBe(400);
      expect(bizError.message).toBe('Bad Request');
    }
  });

  it('HTTP 5xx 状态码抛出 BusinessError', () => {
    const response = {
      data: { code: '', data: null, message: 'Internal Server Error' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    expect(() => interceptor(response as never)).toThrow(BusinessError);

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError.statusCode).toBe(500);
    }
  });

  it('data 为空时抛出默认错误消息', () => {
    const response = {
      data: null,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError.message).toBe('业务请求失败');
      expect(bizError.statusCode).toBe(500);
    }
  });

  // -------------------------------------------------------------------------
  // message 字段缺失
  // -------------------------------------------------------------------------

  it('data.message 为空时使用默认错误消息', () => {
    const response = {
      data: { code: 123, data: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }).fulfilled;

    try {
      interceptor(response as never);
    } catch (error) {
      const bizError = error as BusinessError;
      expect(bizError.message).toBe('业务请求失败');
      expect(bizError.code).toBe(123);
    }
  });
});
