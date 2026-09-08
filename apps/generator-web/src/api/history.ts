/**
 * HistoryController API 封装。
 *
 * <p>对应后端 {@code HistoryController}，路径前缀 /api/generator/history。
 * <p>提供生成任务历史查询、文件明细、回滚等功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/history.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { GenHistory, GenHistoryFile } from './models';

/**
 * 查询最近 N 条任务记录。
 *
 * @param params 包含 limit（默认 20）
 * @returns 历史列表
 */
export function listRecentHistory(params?: { limit?: number }): Promise<GenHistory[]> {
  return requestClient.get<GenHistory[]>(`/api/generator/history`, { params });
}

/**
 * 查询任务详情。
 *
 * @param id 任务 ID
 * @returns 任务实体
 */
export function getHistoryById({ id }: { id: number }): Promise<GenHistory> {
  return requestClient.get<GenHistory>(`/api/generator/history/${id}`);
}

/**
 * 查询任务文件明细。
 *
 * @param id 任务 ID
 * @returns 文件列表
 */
export function listHistoryFiles({ id }: { id: number }): Promise<GenHistoryFile[]> {
  return requestClient.get<GenHistoryFile[]>(`/api/generator/history/${id}/files`);
}

/**
 * 回滚任务（恢复/删除文件）。
 *
 * @param id 任务 ID
 */
export function rollbackHistory({ id }: { id: number }): Promise<void> {
  return requestClient.post<void>(`/api/generator/history/${id}/rollback`);
}

/**
 * 删除历史记录。
 *
 * @param id 任务 ID
 */
export function deleteHistory({ id }: { id: number }): Promise<void> {
  return requestClient.delete<void>(`/api/generator/history/${id}`);
}
