/**
 * literule OpenAPI SDK 客户端入口
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>基于 openapi-fetch 创建的类型安全 API 客户端。
 *
 * @auto-generated
 * @since 4.0.0
 */

import { createOpenApiClient } from '@ydsz/shared-auth';
import type { paths } from './schema';

/**
 * literule 类型安全 API 客户端
 *
 * <p>基于生成的 schema.d.ts 提供完整的类型检查和自动补全。
 * <p>所有 API 路径、参数、响应类型均与后端 OpenAPI 规范对齐。
 *
 * @example
 * ```ts
 * import { apiClient } from '#/api/sdk';
 *
 * // 类型安全的 API 调用
 * const { data, error } = await apiClient.GET('/users/{id}', {
 *   params: { path: { id: '123' } },
 * });
 * ```
 */
export const apiClient = createOpenApiClient<paths>({
  // P0-1 修复：schema 里 paths 是 Controller 相对路径（如 /users/{id}），网关前缀 /api 由
  // requestClient 的 baseURL 注入，baseUrl 必须为空串；此前 '/api/literule' 会拼出
  // /api/system/api/** 之类网关根本不路由的地址
  baseUrl: '',
});

// 导出完整类型供业务代码使用
export type { paths, components, operations } from './schema';

// 导出命名类型别名
export * from './types-export';
