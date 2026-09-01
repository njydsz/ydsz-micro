/**
 * 公共类型定义聚合导出，包含 API 响应类型、基础实体类型及用户信息类型。
 *
 * @path comm\types\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './user';
export type * from '@YDSZ-core/typings';

// P0-1: 后端 API 类型全量对齐
export type * from './api-response';
export type { BaseEntity, TenantEntity, AuditEntity } from './base-entity';
export { isSuccess, unwrapResponse } from './api-response';
