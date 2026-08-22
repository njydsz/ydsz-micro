/**
 * 岗位 API 模块契约测试
 *
 * 覆盖（§6.3 / §17.4）：各 API 的 HTTP method、URL、参数透传。
 * 通过 vi.mock 拦截 requestClient，禁止真实网络请求。
 *
 * @path apps/userinfo-web/src/api/post.test.ts
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
  createPostApi,
  deletePostApi,
  getPostByIdApi,
  getPostListApi,
  getPostPageApi,
  updatePostApi,
} from '#/api/post';
import type { PostApi } from '#/api/post';

describe('post api 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPostPageApi 应以 GET 访问 /api/v1/post/page 并透传分页参数', () => {
    const params: PostApi.PostPageQuery = { pageNum: 1, pageSize: 10 };
    getPostPageApi(params);
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/post/page', {
      params,
    });
  });

  it('getPostListApi 应以 GET 访问 /api/v1/post/list', () => {
    getPostListApi();
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/post/list');
  });

  it('getPostByIdApi 应以 GET 访问带 id 的路径', () => {
    getPostByIdApi('p-1');
    expect(requestClientMock.get).toHaveBeenCalledWith('/api/v1/post/p-1');
  });

  it('createPostApi 应以 POST 访问 /api/v1/post 并透传 DTO', () => {
    const dto: PostApi.PostSaveDTO = { postName: '工程师', status: 1 };
    createPostApi(dto);
    expect(requestClientMock.post).toHaveBeenCalledWith('/api/v1/post', dto);
  });

  it('updatePostApi 应以 PUT 访问 /api/v1/post 并透传 DTO', () => {
    const dto: PostApi.PostSaveDTO = { id: 'p-1', postName: '高级工程师' };
    updatePostApi(dto);
    expect(requestClientMock.put).toHaveBeenCalledWith('/api/v1/post', dto);
  });

  it('deletePostApi 应以 DELETE 访问带 id 的路径', () => {
    deletePostApi('p-1');
    expect(requestClientMock.delete).toHaveBeenCalledWith('/api/v1/post/p-1');
  });
});
