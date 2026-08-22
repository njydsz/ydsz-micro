/**
 * 角色 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传，含权限分配/查询。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/role.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestClientMock } = vi.hoisted(() => ({
  requestClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('#/api/request', () => ({
  requestClient: requestClientMock,
  baseRequestClient: requestClientMock,
  initSharedRequest: vi.fn(),
}));

import {
  assignRolePermissionsApi,
  createRoleApi,
  deleteRoleApi,
  getRoleByIdApi,
  getRoleListApi,
  getRolePageApi,
  getRolePermissionsApi,
  updateRoleApi,
} from '#/api/role';
import type { RoleApi } from '#/api/role';

describe('role api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRolePageApi 应以 GET 访问 /api/v1/role/page 并透传分页参数', () => {
    const params: RoleApi.RolePageQuery = { pageNum: 1, pageSize: 10 };
    getRolePageApi(params);
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/role/page', {
      params,
    });
  });

  it('getRoleListApi 应以 GET 访问 /api/v1/role/list', () => {
    getRoleListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/role/list');
  });

  it('getRoleByIdApi 应以 GET 访问带 id 的路径', () => {
    getRoleByIdApi('r-1');
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/role/r-1');
  });

  it('createRoleApi 应以 POST 访问 /api/v1/role 并透传 DTO', () => {
    const dto: RoleApi.RoleSaveDTO = { roleName: '管理员', status: 1 };
    createRoleApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith('/api/v1/role', dto);
  });

  it('updateRoleApi 应以 PUT 访问 /api/v1/role 并透传 DTO', () => {
    const dto: RoleApi.RoleSaveDTO = { id: 'r-1', roleName: '管理员(改)' };
    updateRoleApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/role', dto);
  });

  it('deleteRoleApi 应以 DELETE 访问带 id 的路径', () => {
    deleteRoleApi('r-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith('/api/v1/role/r-1');
  });

  it('assignRolePermissionsApi 应以 POST 访问 /{roleId}/permissions 并透传权限', () => {
    assignRolePermissionsApi('r-1', ['perm-1', 'perm-2']);
    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/api/v1/role/r-1/permissions',
      { permissionIds: ['perm-1', 'perm-2'] },
    );
  });

  it('getRolePermissionsApi 应以 GET 访问 /{roleId}/permissions', () => {
    getRolePermissionsApi('r-1');
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/api/v1/role/r-1/permissions',
    );
  });
});
