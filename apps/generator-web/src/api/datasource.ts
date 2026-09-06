/**
 * DatasourceController API 封装。
 *
 * <p>对应后端 {@code DatasourceController}，路径前缀 /api/v1/generator/datasources。
 * <p>提供数据源 CRUD 与连接测试功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/datasource.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { GenDatasource, GenDatasourceRespVO } from './models';

/**
 * 查询全部数据源。
 *
 * @returns 数据源列表（不含敏感字段 password）
 */
export function listDatasources(): Promise<GenDatasourceRespVO[]> {
  return requestClient.get<GenDatasourceRespVO[]>(`/api/v1/generator/datasources`);
}

/**
 * 获取默认数据源。
 *
 * @returns 默认数据源
 */
export function getDefaultDatasource(): Promise<GenDatasourceRespVO> {
  return requestClient.get<GenDatasourceRespVO>(`/api/v1/generator/datasources/default`);
}

/**
 * 测试连接。
 *
 * @param datasource 数据源配置
 * @returns 是否连接成功
 */
export function testConnection(datasource: GenDatasource): Promise<boolean> {
  return requestClient.post<boolean>(`/api/v1/generator/datasources/test`, datasource);
}

/**
 * 创建数据源。
 *
 * @param datasource 数据源实体
 * @returns 持久化后实体
 */
export function createDatasource(datasource: GenDatasource): Promise<GenDatasource> {
  return requestClient.post<GenDatasource>(`/api/v1/generator/datasources`, datasource);
}

/**
 * 更新数据源。
 *
 * @param datasource 数据源实体
 * @returns 持久化后实体
 */
export function updateDatasource(datasource: GenDatasource): Promise<GenDatasource> {
  return requestClient.post<GenDatasource>(`/api/v1/generator/datasources/update`, datasource);
}

/**
 * 删除数据源。
 *
 * @param id 数据源 ID
 */
export function deleteDatasource({ id }: { id: number }): Promise<void> {
  return requestClient.delete<void>(`/api/v1/generator/datasources/${id}`);
}
