/**
 * ApiPermissionController API 封装
 *
 * <p>对应后端 {@code ApiPermissionController}，共 6 个端点。
 * <p>路径规范: /api/permission/api/**，成功码统一为 code === 'A00000'。
 *
 * @path apps\system-web\src\api\api-permission.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { PageResponse } from './models';

/** 接口权限视图对象 */
export interface ApiPermissionVO {
  id?: string;
  tenantId?: string;
  apiCode?: string;
  apiName?: string;
  httpMethod?: string;
  urlPattern?: string;
  controllerClass?: string;
  methodName?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 接口权限分页查询参数 */
export interface ApiPermissionPageQuery {
  serialVersionUID?: number;
  apiCode?: string;
  apiName?: string;
  controllerClass?: string;
  status?: string;
}

/**
 * 分页查询接口权限: GET /api/permission/api/page
 */
export function page(params: {
    query?: ApiPermissionPageQuery;
    pageNum?: number;
    pageSize?: number;
  }): Promise<PageResponse<ApiPermissionVO[]>> {
  return requestClient.get<PageResponse<ApiPermissionVO[]>>(`/api/permission/api/page`, { params });
}

/**
 * 查询详情: GET /api/permission/api/{id}
 */
export function getById({ id }: {
    id: string;
  }): Promise<ApiPermissionVO> {
  return requestClient.get<ApiPermissionVO>(`/api/permission/api/${id}`);
}

/**
 * 触发扫描注册: POST /api/permission/api/scan
 */
export function scan(): Promise<number> {
  return requestClient.post<number>(`/api/permission/api/scan`);
}

/**
 * 启用: POST /api/permission/api/{id}/enable
 */
export function enable({ id }: {
    id: string;
  }): Promise<boolean> {
  return requestClient.post<boolean>(`/api/permission/api/${id}/enable`);
}

/**
 * 禁用: POST /api/permission/api/{id}/disable
 */
export function disable({ id }: {
    id: string;
  }): Promise<boolean> {
  return requestClient.post<boolean>(`/api/permission/api/${id}/disable`);
}

/**
 * 删除: DELETE /api/permission/api/{id}
 */
export function remove({ id }: {
    id: string;
  }): Promise<boolean> {
  return requestClient.delete<boolean>(`/api/permission/api/${id}`);
}
