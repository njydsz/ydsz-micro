/**
 * 部门 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/dept.test.ts
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
  createDeptApi,
  deleteDeptApi,
  getDeptByIdApi,
  getDeptListApi,
  getDeptTreeApi,
  updateDeptApi,
} from '#/api/dept';
import type { DeptApi } from '#/api/dept';

describe('dept api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDeptListApi 应以 GET 访问 /api/v1/dept/list', () => {
    getDeptListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/dept/list');
  });

  it('getDeptTreeApi 应以 GET 访问 /api/v1/dept/tree', () => {
    getDeptTreeApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/dept/tree');
  });

  it('getDeptByIdApi 应以 GET 访问带 id 的路径', () => {
    getDeptByIdApi('d-1');
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/dept/d-1');
  });

  it('createDeptApi 应以 POST 访问 /api/v1/dept 并透传 DTO', () => {
    const dto: DeptApi.DepartmentSaveDTO = {
      deptName: '研发部',
      parentId: '0',
      leader: '张三',
    };
    createDeptApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith('/api/v1/dept', dto);
  });

  it('updateDeptApi 应以 PUT 访问 /api/v1/dept 并透传 DTO', () => {
    const dto: DeptApi.DepartmentSaveDTO = {
      id: 'd-1',
      deptName: '研发部(改)',
      parentId: '0',
    };
    updateDeptApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/dept', dto);
  });

  it('deleteDeptApi 应以 DELETE 访问带 id 的路径', () => {
    deleteDeptApi('d-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith('/api/v1/dept/d-1');
  });
});
