/**
 * 公司 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/company.test.ts
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
  createCompanyApi,
  deleteCompanyApi,
  getCompanyByIdApi,
  getCompanyListApi,
  updateCompanyApi,
} from '#/api/company';
import type { CompanyApi } from '#/api/company';

describe('company api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCompanyListApi 应以 GET 访问 /api/v1/company/list', () => {
    getCompanyListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/api/v1/company/list',
    );
  });

  it('getCompanyByIdApi 应以 GET 访问带 id 的路径', () => {
    getCompanyByIdApi('c-1');
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/company/c-1');
  });

  it('createCompanyApi 应以 POST 访问 /api/v1/company 并透传 DTO', () => {
    const dto: CompanyApi.CompanySaveDTO = { companyName: '云顶科技' };
    createCompanyApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/api/v1/company',
      dto,
    );
  });

  it('updateCompanyApi 应以 PUT 访问 /api/v1/company 并透传 DTO', () => {
    const dto: CompanyApi.CompanySaveDTO = {
      id: 'c-1',
      companyName: '云顶科技(改)',
    };
    updateCompanyApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/company', dto);
  });

  it('deleteCompanyApi 应以 DELETE 访问带 id 的路径', () => {
    deleteCompanyApi('c-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith(
      '/api/v1/company/c-1',
    );
  });
});
