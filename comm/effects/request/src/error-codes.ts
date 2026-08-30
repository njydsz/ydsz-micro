/**
 * 统一错误码平台
 *
 * <p>后端错误码定义和前端的错误处理映射。
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
 * @see docs/云顶编码规范.md
 */

/**
 * 统一错误码枚举
 *
 * <p>与后端 ErrorCode 枚举对齐，前端使用此枚举进行错误判断。
 */
export const ErrorCode = {
  // ===== 通用错误 0xxxx =====
  /** 操作成功 */
  SUCCESS: 'A00000',
  /** 系统繁忙，请稍后重试 */
  SYSTEM_BUSY: 'A00001',
  /** 参数校验失败 */
  PARAM_ERROR: 'B00001',
  /** 未登录或登录已过期 */
  UNAUTHORIZED: 'B00002',
  /** 无权限访问 */
  FORBIDDEN: 'B00003',
  /** 资源不存在 */
  NOT_FOUND: 'B00004',
  /** 请求方法不允许 */
  METHOD_NOT_ALLOWED: 'B00005',
  /** 请求过于频繁 */
  TOO_MANY_REQUESTS: 'B00006',
  /** 服务端内部错误 */
  INTERNAL_ERROR: 'C00001',
  /** 服务不可用 */
  SERVICE_UNAVAILABLE: 'C00002',
  /** 服务调用失败 */
  RPC_ERROR: 'C00003',
  /** 数据库错误 */
  DB_ERROR: 'C00004',
  /** 缓存错误 */
  CACHE_ERROR: 'C00005',

  // ===== 用户模块错误 2xxxx =====
  /** 用户不存在 */
  USER_NOT_FOUND: 'D00001',
  /** 用户已存在 */
  USER_ALREADY_EXISTS: 'D00002',
  /** 密码错误 */
  USER_PASSWORD_ERROR: 'D00003',
  /** 用户已被禁用 */
  USER_DISABLED: 'D00004',
  /** 用户未激活 */
  USER_INACTIVE: 'D00005',
  /** 手机号已注册 */
  PHONE_ALREADY_EXISTS: 'D00006',
  /** 邮箱已注册 */
  EMAIL_ALREADY_EXISTS: 'D00007',

  // ===== 工作流模块错误 3xxxx =====
  /** 工作流不存在 */
  WORKFLOW_NOT_FOUND: 'E00001',
  /** 工作流已存在 */
  WORKFLOW_ALREADY_EXISTS: 'E00002',
  /** 工作流状态错误 */
  WORKFLOW_STATUS_ERROR: 'E00003',
  /** 工作流节点不存在 */
  WORKFLOW_NODE_NOT_FOUND: 'E00004',

  // ===== 消息模块错误 4xxxx =====
  /** 消息不存在 */
  MESSAGE_NOT_FOUND: 'F00001',
  /** 消息发送失败 */
  MESSAGE_SEND_FAILED: 'F00002',
  /** 消息模板不存在 */
  MESSAGE_TEMPLATE_NOT_FOUND: 'F00003',

  // ===== 系统配置模块错误 5xxxx =====
  /** 配置不存在 */
  CONFIG_NOT_FOUND: 'G00001',
  /** 配置键已存在 */
  CONFIG_KEY_EXISTS: 'G00002',
  /** 配置值格式错误 */
  CONFIG_VALUE_INVALID: 'G00003',

  // ===== 文件模块错误 6xxxx =====
  /** 文件上传失败 */
  FILE_UPLOAD_FAILED: 'H00001',
  /** 文件大小超限 */
  FILE_SIZE_EXCEEDED: 'H00002',
  /** 文件类型不支持 */
  FILE_TYPE_UNSUPPORTED: 'H00003',
  /** 文件不存在 */
  FILE_NOT_FOUND: 'H00004',

  // ===== 多租户模块错误 7xxxx =====
  /** 租户不存在 */
  TENANT_NOT_FOUND: 'I00001',
  /** 租户已过期 */
  TENANT_EXPIRED: 'I00002',
  /** 租户配额已满 */
  TENANT_QUOTA_EXCEEDED: 'I00003',
} as const;

/**
 * 错误码类型
 */
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 错误码元信息
 */
interface ErrorCodeMeta {
  /** 错误码 */
  code: string;
  /** 默认错误消息 */
  message: string;
  /** HTTP 状态码 */
  httpStatus?: number;
  /** 是否可重试 */
  retryable?: boolean;
  /** 错误级别 */
  level: 'info' | 'warn' | 'error';
}

/**
 * 错误码元信息映射
 */
const ERROR_CODE_META: Record<string, ErrorCodeMeta> = {
  // 通用错误
  [ErrorCode.SUCCESS]: { code: ErrorCode.SUCCESS, message: '操作成功', level: 'info' },
  [ErrorCode.SYSTEM_BUSY]: {
    code: ErrorCode.SYSTEM_BUSY,
    message: '系统繁忙，请稍后重试',
    level: 'warn',
    retryable: true,
  },
  [ErrorCode.PARAM_ERROR]: { code: ErrorCode.PARAM_ERROR, message: '参数校验失败', level: 'warn' },
  [ErrorCode.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHORIZED,
    message: '未登录或登录已过期',
    level: 'warn',
    httpStatus: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: '无权限访问',
    level: 'warn',
    httpStatus: 403,
  },
  [ErrorCode.NOT_FOUND]: {
    code: ErrorCode.NOT_FOUND,
    message: '资源不存在',
    level: 'warn',
    httpStatus: 404,
  },
  [ErrorCode.METHOD_NOT_ALLOWED]: {
    code: ErrorCode.METHOD_NOT_ALLOWED,
    message: '请求方法不允许',
    level: 'warn',
    httpStatus: 405,
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: '请求过于频繁，请稍后重试',
    level: 'warn',
    httpStatus: 429,
    retryable: true,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    message: '服务端内部错误',
    level: 'error',
    httpStatus: 500,
    retryable: true,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: '服务不可用',
    level: 'error',
    httpStatus: 503,
    retryable: true,
  },
  [ErrorCode.RPC_ERROR]: {
    code: ErrorCode.RPC_ERROR,
    message: '服务调用失败',
    level: 'error',
    retryable: true,
  },
  [ErrorCode.DB_ERROR]: {
    code: ErrorCode.DB_ERROR,
    message: '数据库错误',
    level: 'error',
    retryable: true,
  },
  [ErrorCode.CACHE_ERROR]: {
    code: ErrorCode.CACHE_ERROR,
    message: '缓存错误',
    level: 'error',
    retryable: true,
  },

  // 用户模块
  [ErrorCode.USER_NOT_FOUND]: {
    code: ErrorCode.USER_NOT_FOUND,
    message: '用户不存在',
    level: 'warn',
  },
  [ErrorCode.USER_ALREADY_EXISTS]: {
    code: ErrorCode.USER_ALREADY_EXISTS,
    message: '用户已存在',
    level: 'warn',
  },
  [ErrorCode.USER_PASSWORD_ERROR]: {
    code: ErrorCode.USER_PASSWORD_ERROR,
    message: '密码错误',
    level: 'warn',
  },
  [ErrorCode.USER_DISABLED]: {
    code: ErrorCode.USER_DISABLED,
    message: '用户已被禁用',
    level: 'warn',
  },
  [ErrorCode.USER_INACTIVE]: {
    code: ErrorCode.USER_INACTIVE,
    message: '用户未激活',
    level: 'warn',
  },
  [ErrorCode.PHONE_ALREADY_EXISTS]: {
    code: ErrorCode.PHONE_ALREADY_EXISTS,
    message: '手机号已注册',
    level: 'warn',
  },
  [ErrorCode.EMAIL_ALREADY_EXISTS]: {
    code: ErrorCode.EMAIL_ALREADY_EXISTS,
    message: '邮箱已注册',
    level: 'warn',
  },

  // 工作流模块
  [ErrorCode.WORKFLOW_NOT_FOUND]: {
    code: ErrorCode.WORKFLOW_NOT_FOUND,
    message: '工作流不存在',
    level: 'warn',
  },
  [ErrorCode.WORKFLOW_ALREADY_EXISTS]: {
    code: ErrorCode.WORKFLOW_ALREADY_EXISTS,
    message: '工作流已存在',
    level: 'warn',
  },
  [ErrorCode.WORKFLOW_STATUS_ERROR]: {
    code: ErrorCode.WORKFLOW_STATUS_ERROR,
    message: '工作流状态错误',
    level: 'warn',
  },
  [ErrorCode.WORKFLOW_NODE_NOT_FOUND]: {
    code: ErrorCode.WORKFLOW_NODE_NOT_FOUND,
    message: '工作流节点不存在',
    level: 'warn',
  },

  // 消息模块
  [ErrorCode.MESSAGE_NOT_FOUND]: {
    code: ErrorCode.MESSAGE_NOT_FOUND,
    message: '消息不存在',
    level: 'warn',
  },
  [ErrorCode.MESSAGE_SEND_FAILED]: {
    code: ErrorCode.MESSAGE_SEND_FAILED,
    message: '消息发送失败',
    level: 'error',
    retryable: true,
  },
  [ErrorCode.MESSAGE_TEMPLATE_NOT_FOUND]: {
    code: ErrorCode.MESSAGE_TEMPLATE_NOT_FOUND,
    message: '消息模板不存在',
    level: 'warn',
  },

  // 系统配置模块
  [ErrorCode.CONFIG_NOT_FOUND]: {
    code: ErrorCode.CONFIG_NOT_FOUND,
    message: '配置不存在',
    level: 'warn',
  },
  [ErrorCode.CONFIG_KEY_EXISTS]: {
    code: ErrorCode.CONFIG_KEY_EXISTS,
    message: '配置键已存在',
    level: 'warn',
  },
  [ErrorCode.CONFIG_VALUE_INVALID]: {
    code: ErrorCode.CONFIG_VALUE_INVALID,
    message: '配置值格式错误',
    level: 'warn',
  },

  // 文件模块
  [ErrorCode.FILE_UPLOAD_FAILED]: {
    code: ErrorCode.FILE_UPLOAD_FAILED,
    message: '文件上传失败',
    level: 'error',
    retryable: true,
  },
  [ErrorCode.FILE_SIZE_EXCEEDED]: {
    code: ErrorCode.FILE_SIZE_EXCEEDED,
    message: '文件大小超限',
    level: 'warn',
  },
  [ErrorCode.FILE_TYPE_UNSUPPORTED]: {
    code: ErrorCode.FILE_TYPE_UNSUPPORTED,
    message: '文件类型不支持',
    level: 'warn',
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    code: ErrorCode.FILE_NOT_FOUND,
    message: '文件不存在',
    level: 'warn',
  },

  // 多租户模块
  [ErrorCode.TENANT_NOT_FOUND]: {
    code: ErrorCode.TENANT_NOT_FOUND,
    message: '租户不存在',
    level: 'warn',
  },
  [ErrorCode.TENANT_EXPIRED]: {
    code: ErrorCode.TENANT_EXPIRED,
    message: '租户已过期',
    level: 'warn',
  },
  [ErrorCode.TENANT_QUOTA_EXCEEDED]: {
    code: ErrorCode.TENANT_QUOTA_EXCEEDED,
    message: '租户配额已满',
    level: 'warn',
  },
};

/**
 * 获取错误消息
 *
 * @param code 错误码
 * @param defaultMessage 默认错误消息（当错误码未定义时使用）
 * @returns 错误消息
 */
export function getErrorMessage(code: string, defaultMessage = '未知错误'): string {
  return ERROR_CODE_META[code]?.message ?? defaultMessage;
}

/**
 * 获取错误元信息
 *
 * @param code 错误码
 * @returns 错误元信息
 */
export function getErrorMeta(code: string): ErrorCodeMeta | undefined {
  return ERROR_CODE_META[code];
}

/**
 * 判断错误是否可重试
 *
 * @param code 错误码
 * @returns 是否可重试
 */
export function isRetryableError(code: string): boolean {
  return ERROR_CODE_META[code]?.retryable ?? false;
}

/**
 * 判断错误级别
 *
 * @param code 错误码
 * @returns 错误级别
 */
export function getErrorLevel(code: string): 'info' | 'warn' | 'error' {
  return ERROR_CODE_META[code]?.level ?? 'error';
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
