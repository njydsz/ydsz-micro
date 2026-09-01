/**
 * 业务错误类
 *
 * <p>用于封装后端返回的业务错误信息，保留完整的错误上下文。
 * <p>错误码统一为字符串（后端 YdszResponse.code 为 'A00000' 风格字符串码），
 * 重试语义由错误码元信息（error-codes.ts，单一事实源生成）推断。
 *
 * <p>符合云顶编码规范 §14 错误处理与日志规范。
 *
 * @path comm/effects/request/src/request-client/business-error.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { getErrorMeta } from '../error-codes';

/**
 * 业务错误类
 */
export class BusinessError extends Error {
  /** 业务错误码（后端字符串码；非业务错误场景为 '-1'） */
  code: string;
  /** 响应数据 */
  data: unknown;
  /** HTTP 状态码（未知时为 -1） */
  statusCode: number;
  /** 是否可重试（由错误码元信息推断，未知码默认 false） */
  retryable: boolean;

  constructor(
    message: string,
    options: { code?: string; data?: unknown; statusCode?: number } = {},
  ) {
    super(message);
    this.name = 'BusinessError';
    this.code = options.code ?? '-1';
    this.data = options.data ?? null;
    this.statusCode = options.statusCode ?? -1;
    this.retryable = getErrorMeta(this.code)?.retryable ?? false;
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
