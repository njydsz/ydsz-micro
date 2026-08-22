/**
 * 菜单 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/menu.test.ts
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
  createMenuApi,
  deleteMenuApi,
  getMenuByIdApi,
  getMenuListApi,
  getMenuTreeApi,
  updateMenuApi,
} from '#/api/menu';
import type { MenuApi } from '#/api/menu';

describe('menu api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMenuListApi 应以 GET 访问 /api/v1/menu/list', () => {
    getMenuListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/menu/list');
  });

  it('getMenuTreeApi 应以 GET 访问 /api/v1/menu/tree', () => {
    getMenuTreeApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/menu/tree');
  });

  it('getMenuByIdApi 应以 GET 访问带 id 的路径', () => {
    getMenuByIdApi('m-1');
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/menu/m-1');
  });

  it('createMenuApi 应以 POST 访问 /api/v1/menu 并透传 DTO', () => {
    const dto: MenuApi.MenuSaveDTO = {
      menuName: '系统管理',
      parentId: '0',
      menuType: 1,
      path: '/system',
    };
    createMenuApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith('/api/v1/menu', dto);
  });

  it('updateMenuApi 应以 PUT 访问 /api/v1/menu 并透传 DTO', () => {
    const dto: MenuApi.MenuSaveDTO = {
      id: 'm-1',
      menuName: '系统管理(改)',
      parentId: '0',
      menuType: 1,
    };
    updateMenuApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/menu', dto);
  });

  it('deleteMenuApi 应以 DELETE 访问带 id 的路径', () => {
    deleteMenuApi('m-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith('/api/v1/menu/m-1');
  });
});
