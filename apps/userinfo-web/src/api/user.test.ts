/**
 * 用户账号 API 模块契约测试
 *
 * 覆盖（§6.3 接口定义规范 / §17.4 外部依赖必须 Mock）：
 * - 各 API 函数的 HTTP method 与 URL 正确性
 * - 查询参数、路径参数、请求体的正确透传
 * - 泛型返回类型的入参约束
 *
 * 通过 vi.mock 拦截 @ydsz/shared-auth 的 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/user.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================
// Mock: #/api/request → requestClient（禁止真实网络）
// 使用 vi.hoisted 避免 vi.mock 工厂提升导致的 TDZ 问题
// ============================================================
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
  assignUserRolesApi,
  changePasswordApi,
  createUserApi,
  deleteUserApi,
  getUserByIdApi,
  getUserListApi,
  getUserPageApi,
  getUserRolesApi,
  resetPasswordApi,
  updateUserApi,
} from '#/api/user';
import type { UserApi } from '#/api/user';

describe('user api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('查询类接口', () => {
    it('getUserPageApi 应以 GET 访问 /api/v1/user/page 并透传查询参数', () => {
      const params: UserApi.UserAccountPageQuery = {
        pageNum: 1,
        pageSize: 20,
        username: 'zhangsan',
        status: 1,
      };
      getUserPageApi(params);

      expect(requestClientMock.get).toHaveBeenCalledTimes(1);
      expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/user/page', {
        params,
      });
    });

    it('getUserListApi 应以 GET 访问 /api/v1/user/list（无参）', () => {
      getUserListApi();
      expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/user/list');
    });

    it('getUserByIdApi 应以 GET 访问带 id 的路径', () => {
      getUserByIdApi('u-1001');
      expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/user/u-1001');
    });
  });

  describe('写操作接口', () => {
    it('createUserApi 应以 POST 访问 /api/v1/user 并透传 DTO', () => {
      const dto: UserApi.UserAccountCreateDTO = {
        username: 'lisi',
        password: 'secret-123',
        realName: '李四',
        deptId: 'd-1',
      };
      createUserApi(dto);
      expect(requestClientMock.post).toHaveBeenCalledWith('/api/v1/user', dto);
    });

    it('updateUserApi 应以 PUT 访问 /api/v1/user 并透传 DTO', () => {
      const dto: UserApi.UserAccountUpdateDTO = {
        id: 'u-1001',
        realName: '王五',
        status: 0,
      };
      updateUserApi(dto);
      expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/user', dto);
    });

    it('deleteUserApi 应以 DELETE 访问带 id 的路径', () => {
      deleteUserApi('u-1001');
      expect(requestClientMock.delete).toHaveBeenCalledWith(
        '/api/v1/user/u-1001',
      );
    });
  });

  describe('密码与角色接口', () => {
    it('changePasswordApi 应以 POST 访问 /change-password', () => {
      const dto: UserApi.ChangePasswordDTO = {
        userId: 'u-1001',
        oldPassword: 'old',
        newPassword: 'new',
      };
      changePasswordApi(dto);
      expect(requestClientMock.post).toHaveBeenCalledWith(
        '/api/v1/user/change-password',
        dto,
      );
    });

    it('resetPasswordApi 应以 POST 访问 /reset-password', () => {
      const dto: UserApi.ResetPasswordDTO = {
        userId: 'u-1001',
        newPassword: 'reset-123',
      };
      resetPasswordApi(dto);
      expect(requestClientMock.post).toHaveBeenCalledWith(
        '/api/v1/user/reset-password',
        dto,
      );
    });

    it('assignUserRolesApi 应以 POST 访问 /{userId}/roles 并透传 roleIds', () => {
      assignUserRolesApi('u-1001', ['r-1', 'r-2']);
      expect(requestClientMock.post).toHaveBeenCalledWith(
        '/api/v1/user/u-1001/roles',
        { roleIds: ['r-1', 'r-2'] },
      );
    });

    it('getUserRolesApi 应以 GET 访问 /{userId}/roles', () => {
      getUserRolesApi('u-1001');
      expect(requestClientMock.get).toHaveBeenCalledWith(
        '/api/v1/user/u-1001/roles',
      );
    });
  });
});
