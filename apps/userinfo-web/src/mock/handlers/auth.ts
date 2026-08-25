/**
 * 认证相关 Mock 处理器
 *
 * @path apps/userinfo-web/src/mock/handlers/auth.ts
 * @author ydsz-team
 * @since 4.0.0
 */

/** Mock 处理器接口 */
interface MockHandler {
  test: (url: string, method: string) => boolean;
  handle: (url: string, init?: RequestInit) => Promise<unknown>;
}

/** 模拟用户数据 */
const mockUser = {
  userId: 'mock-user-001',
  username: 'admin',
  email: 'admin@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  roles: ['admin'],
  permissions: ['user:view', 'user:edit', 'user:delete'],
};

/** 模拟登录响应 */
const mockLoginResponse = {
  code: 'A00000',
  data: {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    expiresIn: 7200,
    userInfo: mockUser,
  },
  message: 'success',
};

/** 模拟菜单数据 */
const mockMenuResponse = {
  code: 'A00000',
  data: [
    {
      path: '/users',
      name: 'Users',
      meta: { title: '用户列表', icon: 'lucide:users' },
      children: [],
    },
    {
      path: '/roles',
      name: 'Roles',
      meta: { title: '角色管理', icon: 'lucide:shield' },
      children: [],
    },
  ],
  message: 'success',
};

export const mockAuthHandlers: MockHandler[] = [
  // 登录
  {
    test: (url, method) => url.includes('/api/v1/auth/login') && method === 'POST',
    handle: async () => mockLoginResponse,
  },
  // 获取用户信息
  {
    test: (url, method) => url.includes('/api/v1/auth/userinfo') && method === 'GET',
    handle: async () => ({ code: 'A00000', data: mockUser, message: 'success' }),
  },
  // 登出
  {
    test: (url, method) => url.includes('/api/v1/auth/logout') && method === 'POST',
    handle: async () => ({ code: 'A00000', data: null, message: 'success' }),
  },
  // 刷新 Token
  {
    test: (url, method) => url.includes('/api/v1/auth/refresh') && method === 'POST',
    handle: async () => ({
      code: 'A00000',
      data: {
        accessToken: 'mock-access-token-refreshed-' + Date.now(),
        refreshToken: 'mock-refresh-token-refreshed-' + Date.now(),
        expiresIn: 7200,
      },
      message: 'success',
    }),
  },
  // 获取菜单
  {
    test: (url, method) => url.includes('/api/v1/menu') && method === 'GET',
    handle: async () => mockMenuResponse,
  },
];
