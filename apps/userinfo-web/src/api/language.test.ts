/**
 * 语言 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/language.test.ts
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
  createLanguageApi,
  deleteLanguageApi,
  getLanguageByIdApi,
  getLanguageListApi,
  getLanguagePageApi,
  updateLanguageApi,
} from '#/api/language';
import type { LanguageApi } from '#/api/language';

describe('language api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLanguagePageApi 应以 GET 访问 /api/v1/language/page 并透传分页参数', () => {
    const params: LanguageApi.LanguagePageQuery = { pageNum: 1, pageSize: 10 };
    getLanguagePageApi(params);
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/api/v1/language/page',
      { params },
    );
  });

  it('getLanguageListApi 应以 GET 访问 /api/v1/language/list', () => {
    getLanguageListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/api/v1/language/list',
    );
  });

  it('getLanguageByIdApi 应以 GET 访问带 id 的路径', () => {
    getLanguageByIdApi('l-1');
    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/api/v1/language/l-1',
    );
  });

  it('createLanguageApi 应以 POST 访问 /api/v1/language 并透传 DTO', () => {
    const dto: LanguageApi.LanguageSaveDTO = {
      langCode: 'zh-CN',
      langName: '简体中文',
    };
    createLanguageApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/api/v1/language',
      dto,
    );
  });

  it('updateLanguageApi 应以 PUT 访问 /api/v1/language 并透传 DTO', () => {
    const dto: LanguageApi.LanguageSaveDTO = {
      id: 'l-1',
      langCode: 'zh-CN',
      langName: '简体中文(改)',
    };
    updateLanguageApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith(
      '/api/v1/language',
      dto,
    );
  });

  it('deleteLanguageApi 应以 DELETE 访问带 id 的路径', () => {
    deleteLanguageApi('l-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith(
      '/api/v1/language/l-1',
    );
  });
});
