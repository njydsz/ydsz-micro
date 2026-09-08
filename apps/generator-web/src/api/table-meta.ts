/**
 * TableMetaController API 封装。
 *
 * <p>对应后端 {@code TableMetaController}，路径前缀 /api/generator/tables。
 * <p>提供表元数据查询与列元数据管理功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/table-meta.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { GenColumnMeta, GenTableMeta } from './models';

/**
 * 查询数据源下全部表（缓存）。
 *
 * @param datasourceId 数据源 ID
 * @returns 表元数据列表
 */
export function listTables(params: { datasourceId: number }): Promise<GenTableMeta[]> {
  return requestClient.get<GenTableMeta[]>(`/api/generator/tables`, { params });
}

/**
 * 刷新数据源表元数据。
 *
 * @param params 包含 datasourceId
 * @returns 刷新后列表
 */
export function refreshTables(params: { datasourceId: number }): Promise<GenTableMeta[]> {
  return requestClient.post<GenTableMeta[]>(`/api/generator/tables/refresh`, { params });
}

/**
 * 查询表的列元数据。
 *
 * @param params 包含 tableMetaId
 * @returns 列元数据列表
 */
export function getColumns(params: { tableMetaId: number }): Promise<GenColumnMeta[]> {
  return requestClient.get<GenColumnMeta[]>(`/api/generator/tables/columns`, { params });
}

/**
 * 刷新表的列元数据。
 *
 * @param params 包含 datasourceId + tableName
 * @returns 列元数据列表
 */
export function refreshColumns(params: {
  datasourceId: number;
  tableName: string;
}): Promise<GenColumnMeta[]> {
  return requestClient.post<GenColumnMeta[]>(`/api/generator/tables/columns/refresh`, { params });
}
