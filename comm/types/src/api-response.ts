/**
 * 后端统一响应类型定义 — 与后端 BaseResponse 对齐。
 *
 * 提供统一 API 响应结构、分页数据结构及响应解包工具函数。
 * 后端类：com.YDSZ.common.core.response.BaseResponse
 *
 * @path comm\types\src\api-response.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 统一 API 返回结果 */
export interface BaseResponse<T = unknown> {
  /** 业务响应码，"A00000" 表示成功（与后端 BaseResponse.SUCCESS 对齐）。注意：这是业务响应码，不是 HTTP 状态码。 */
  code: string;
  /** 响应消息 */
  msg: string;
  /** 响应数据 */
  data: T;
  /** 响应时间戳 */
  timestamp: string;
  /** 异常信息（仅错误时存在） */
  info?: {
    code: string;
    key: string;
    message: string;
    httpStatus: number;
    path?: string;
    traceId?: string;
  };
}

/** 分页返回结果 — 与 PageResponse 对齐 */
export type PageResponse<T = unknown> = BaseResponse<PageData<T>>;

/** 分页数据 */
export interface PageData<T = unknown> {
  /** 当前页数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  pages: number;
}

/** 分页查询参数 — 与 PageQuery 对齐 */
export interface PageQuery {
  pageNum: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * 判断 API 响应是否成功（业务响应码 "A00000"）。
 *
 * @param resp - API 响应对象
 * @returns 当 code 为 "A00000" 时返回 true
 */
export function isSuccess<T>(resp: BaseResponse<T>): resp is BaseResponse<T> & { data: T } {
  return resp.code === 'A00000';
}

/**
 * 提取响应数据，非成功状态抛出错误。
 *
 * @param resp - API 响应对象
 * @returns 响应数据
 * @throws {Error} 当 code 不为 "A00000" 时抛出含 msg 的错误
 */
export function unwrapResponse<T>(resp: BaseResponse<T>): T {
  if (resp.code !== 'A00000') {
    throw new Error(resp.msg || 'Unknown error');
  }
  return resp.data;
}
