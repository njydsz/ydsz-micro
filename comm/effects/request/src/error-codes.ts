/**
 * 统一错误码平台
 *
 * <p>错误码常量由 bash/gen-error-codes.mjs 从后端 ydsz-cloud 静态提取生成
 * （error-codes.generated.ts，单一事实源），本文件仅承载运行时语义层：
 * HTTP 状态推断、重试判定、错误级别与 BusinessError 构造。
 *
 * <p>后端新增/修改错误码后运行 pnpm gen:error-codes 重新生成；
 * CI 通过 gen:error-codes:check 门禁拦截漂移。禁止在本文件手抄错误码常量。
 *
 * <p>符合云顶编码规范 §14 错误处理与日志规范、§18.7 错误码规范。
 *
 * <p>使用方式:
 * <pre>{@code
 *   import { ErrorCode, getErrorMessage } from '@ydsz/request';
 *
 *   if (response.code === ErrorCode.USER_NOT_FOUND) {
 *     message.error(getErrorMessage(ErrorCode.USER_NOT_FOUND));
 *   }
 * }</pre>
 *
 * @path comm/effects/request/src/error-codes.ts
 * @author ydsz-team
 * @since 4.0.0
 * @see error-codes.generated.ts（生成常量与元信息）
 * @see docs/云顶编码规范.md
 */

import {
  GENERATED_ERROR_CODE_META,
  GeneratedErrorCode,
  type GeneratedErrorCodeMeta,
} from './error-codes.generated';

/**
 * 统一错误码枚举
 *
 * <p>与后端 ErrorCodeTable 注册表同源（生成产物），前端使用此枚举进行错误判断。
 */
export const ErrorCode = { ...GeneratedErrorCode } as const;

/**
 * 错误码类型
 */
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 错误码元信息（与生成元信息字段一致，对外只读）
 */
export type ErrorCodeMeta = GeneratedErrorCodeMeta;

/**
 * 平台通用码的 HTTP 语义补充
 *
 * <p>YdszResultCode 为 2 参定义（code + msg），未携带 HTTP 状态码；
 * 此处按平台语义补充，仅作用于这些通用码，不覆盖后端已声明 httpStatus 的业务码。
 */
const PLATFORM_HTTP_STATUS_OVERRIDES: Record<string, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * 平台通用码的可重试语义补充
 *
 * <p>同上：YdszResultCode 未携带 retryable 标记，按语义补充基础设施类可重试错误。
 */
const PLATFORM_RETRYABLE_OVERRIDES: ReadonlySet<string> = new Set([
  ErrorCode.SYSTEM_BUSY,
  ErrorCode.TOO_MANY_REQUESTS,
  ErrorCode.INTERNAL_ERROR,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.RPC_ERROR,
  ErrorCode.DB_ERROR,
  ErrorCode.CACHE_ERROR,
]);

/** 错误级别与码段/元信息的映射兜底 */
type ErrorLevel = 'info' | 'warn' | 'error';

/**
 * 组装完整元信息视图：生成元信息 + 平台语义补充
 *
 * @param code 错误码
 * @returns 补充语义后的元信息（未知错误码返回 undefined）
 */
function resolveMeta(code: string): ErrorCodeMeta | undefined {
  const base = GENERATED_ERROR_CODE_META[code];
  if (!base) {
    return undefined;
  }
  const httpStatus = base.httpStatus ?? PLATFORM_HTTP_STATUS_OVERRIDES[code];
  const retryable = base.retryable ?? PLATFORM_RETRYABLE_OVERRIDES.has(code);
  return { ...base, httpStatus, retryable };
}

/**
 * 获取错误消息
 *
 * @param code 错误码
 * @param defaultMessage 默认错误消息（当错误码未定义时使用）
 * @returns 错误消息
 */
export function getErrorMessage(code: string, defaultMessage = '未知错误'): string {
  return resolveMeta(code)?.message ?? defaultMessage;
}

/**
 * 获取错误元信息
 *
 * @param code 错误码
 * @returns 错误元信息
 */
export function getErrorMeta(code: string): ErrorCodeMeta | undefined {
  return resolveMeta(code);
}

/**
 * 判断错误是否可重试
 *
 * @param code 错误码
 * @returns 是否可重试
 */
export function isRetryableError(code: string): boolean {
  return resolveMeta(code)?.retryable ?? false;
}

/**
 * 判断错误级别：成功为 info，客户端错误为 warn，服务端错误为 error
 *
 * @param code 错误码
 * @returns 错误级别
 */
export function getErrorLevel(code: string): ErrorLevel {
  const meta = resolveMeta(code);
  if (meta) {
    return code === ErrorCode.SUCCESS ? 'info' : meta.httpStatus && meta.httpStatus >= 500 ? 'error' : 'warn';
  }
  return 'error';
}

/**
 * 业务错误类
 */
export class BusinessError extends Error {
  /** 错误码 */
  public readonly code: string;
  /** 错误详情 */
  public readonly details?: Record<string, unknown>;
  /** HTTP 状态码 */
  public readonly httpStatus?: number;
  /** 是否可重试 */
  public readonly retryable: boolean;

  constructor(code: string, message?: string, details?: Record<string, unknown>) {
    super(message || getErrorMessage(code));
    this.name = 'BusinessError';
    this.code = code;
    this.details = details;
    this.httpStatus = getErrorMeta(code)?.httpStatus;
    this.retryable = isRetryableError(code);
  }
}

/**
 * 判断是否为业务错误
 *
 * @param error 错误对象
 * @returns 是否为业务错误
 */
export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}
