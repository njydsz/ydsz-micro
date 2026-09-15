/**
 * CEP（复杂事件处理）扩展 API 封装
 *
 * <p>覆盖 {@code CEPController} 中 {@code cep.ts} 未生成的端点
 * （模式详情 / 更新 / 启停 / 测试 / 命中统计 / 命中记录 / 检测历史）。
 * <p>路径规范: /api/literule/cep/**，成功码统一为 code === 'A00000'。
 *
 * @path apps\literule-web\src\api\cepExtend.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { CEPPatternVO } from './models';

/**
 * getPattern: GET /api/literule/cep/patterns/{id}
 */
export function getPattern({ id }: {
    id: string;
}): Promise<CEPPatternVO> {
  return requestClient.get<CEPPatternVO>(`/api/literule/cep/patterns/${id}`);
}

/**
 * updatePattern: PUT /api/literule/cep/patterns/{id}
 */
export function updatePattern({ id }: {
    id: string;
  }, data: CEPPatternVO): Promise<void> {
  return requestClient.put<void>(`/api/literule/cep/patterns/${id}`, data);
}

/**
 * enablePattern: POST /api/literule/cep/patterns/{id}/enable
 */
export function enablePattern({ id }: {
    id: string;
}): Promise<void> {
  return requestClient.post<void>(`/api/literule/cep/patterns/${id}/enable`);
}

/**
 * disablePattern: POST /api/literule/cep/patterns/{id}/disable
 */
export function disablePattern({ id }: {
    id: string;
}): Promise<void> {
  return requestClient.post<void>(`/api/literule/cep/patterns/${id}/disable`);
}

/**
 * testPattern: POST /api/literule/cep/patterns/{id}/test
 */
export function testPattern({ id }: {
    id: string;
  }, data: Record<string, Record<string, unknown>>): Promise<Record<string, Record<string, unknown>>> {
  return requestClient.post<Record<string, Record<string, unknown>>>(`/api/literule/cep/patterns/${id}/test`, data);
}

/**
 * getPatternStatistics: GET /api/literule/cep/patterns/{id}/statistics
 */
export function getPatternStatistics({ id }: {
    id: string;
}): Promise<Record<string, unknown>> {
  return requestClient.get<Record<string, unknown>>(`/api/literule/cep/patterns/${id}/statistics`);
}

/**
 * getPatternHits: GET /api/literule/cep/patterns/{id}/hits
 */
export function getPatternHits({ id }: {
    id: string;
  }, params: {
    pageNum?: number;
    pageSize?: number;
  }): Promise<Record<string, unknown>> {
  return requestClient.get<Record<string, unknown>>(`/api/literule/cep/patterns/${id}/hits`, { params });
}

/**
 * getPatternHistory: GET /api/literule/cep/patterns/{id}/history
 */
export function getPatternHistory({ id }: {
    id: string;
}): Promise<Record<string, unknown>[]> {
  return requestClient.get<Record<string, unknown>[]>(`/api/literule/cep/patterns/${id}/history`);
}
