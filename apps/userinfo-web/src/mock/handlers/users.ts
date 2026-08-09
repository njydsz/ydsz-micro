/**
 * 用户管理相关 Mock 处理器
 *
 * @path apps/userinfo-web/src/mock/handlers/users.ts
 * @author ydsz-team
 * @since 4.0.0
 */

/** Mock 处理器接口 */
interface MockHandler {
  test: (url: string, method: string) => boolean;
  handle: (url: string, init?: RequestInit) => Promise<unknown>;
}

/** 生成模拟用户列表 */
function generateMockUsers(count = 20) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      userId: `user-${String(i).padStart(3, '0')}`,
      username: `user${i}`,
      email: `user${i}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      status: i % 5 === 0 ? 'inactive' : 'active',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      department: ['技术部', '产品部', '运营部', '市场部'][i % 4],
    });
  }
  return users;
}

const mockUsers = generateMockUsers(50);

export const mockUserHandlers: MockHandler[] = [
  // 用户列表
  {
    test: (url, method) => url.includes('/api/v1/users') && method === 'GET',
    handle: async () => {
      // 模拟分页
      return {
        code: 'A00000',
        data: {
          list: mockUsers.slice(0, 10),
          total: mockUsers.length,
          page: 1,
          pageSize: 10,
        },
        message: 'success',
      };
    },
  },
  // 用户详情
  {
    test: (url, method) => /\/api\/v1\/users\/\w+/.test(url) && method === 'GET',
    handle: async (url) => {
      const userId = url.split('/').pop();
      const user = mockUsers.find((u) => u.userId === userId) || mockUsers[0];
      return { code: 'A00000', data: user, message: 'success' };
    },
  },
  // 创建用户
  {
    test: (url, method) => url.includes('/api/v1/users') && method === 'POST',
    handle: async (_url, init) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const newUser = {
        userId: `user-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      return { code: 'A00000', data: newUser, message: 'success' };
    },
  },
  // 更新用户
  {
    test: (url, method) => /\/api\/v1\/users\/\w+/.test(url) && method === 'PUT',
    handle: async (_url, init) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return { code: 'A00000', data: body, message: 'success' };
    },
  },
  // 删除用户
  {
    test: (url, method) => /\/api\/v1\/users\/\w+/.test(url) && method === 'DELETE',
    handle: async () => ({ code: 'A00000', data: null, message: 'success' }),
  },
];
