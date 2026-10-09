/**
 * FeatureFlagController API 封装
 *
 * <p>对应后端 {@code FeatureFlagController}。
 * <p>路径规范: /api/v1/system/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { PageResponse } from './models';
import type { FeatureFlagDTO, FeatureFlagPageQuery, FeatureFlagVO } from './models';

// ==================== Auto-generated (bash/gen-contract.py) ====================

/**
 * me: GET /feature-flags/me
 */
export function me(): Promise<Record<string, Record<string, unknown>>> {
  return requestClient.get<Record<string, Record<string, unknown>>>(`/feature-flags/me`);
}

// ==================== CRUD 封装 ====================

/**
 * page: GET /feature-flag/page
 */
export function page(query?: FeatureFlagPageQuery): Promise<PageResponse<FeatureFlagVO[]>> {
  return requestClient.get<PageResponse<FeatureFlagVO[]>>(`/feature-flag/page`, { params: query });
}

/**
 * save: POST /feature-flag
 */
export function save(data: FeatureFlagDTO): Promise<string> {
  return requestClient.post<string>(`/feature-flag`, data);
}

/**
 * update: PUT /feature-flag
 */
export function update(data: FeatureFlagDTO): Promise<boolean> {
  return requestClient.put<boolean>(`/feature-flag`, data);
}

/**
 * remove: DELETE /feature-flag/{id}
 */
export function remove({ id }: {
    id: string;
  }): Promise<boolean> {
  return requestClient.delete<boolean>(`/feature-flag/${id}`);
}
