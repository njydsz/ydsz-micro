/**
 * System Web Mock 配置
 *
 * <p>基于 @ydsz/mock-service 提供类型安全的 API Mock。
 * 开发环境设置 VITE_USE_MOCK=true 启用。
 *
 * @path apps/system-web/src/mock/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { faker } from '@faker-js/faker';
import { http, HttpResponse, delay } from 'msw';
import {
  setupMockServer,
  generateMockHandlers,
  createCrudHandlers,
} from '@ydsz/mock-service';
import { createLogger } from '@YDSZ-core/shared/utils';
import spec from '../api/sdk/openapi.json';

/** 模块级日志器 */
const logger = createLogger('SystemMock');

/**
 * 初始化 System Web Mock Server
 *
 * <p>在 main.ts 中调用，需要配合环境变量 VITE_USE_MOCK=true 使用。
 */
export async function initSystemMockServer(): Promise<void> {
  // 1. 从 OpenAPI spec 自动生成基础 handlers
  const autoHandlers = generateMockHandlers(spec as object, {
    enableDelay: true,
    listSize: 10,
    seed: 12345, // 固定种子，确保可重复
  });

  // 2. 自定义特定业务的 handlers（覆盖自动生成）
  const customHandlers = createCrudHandlers('/api/v1/config', {
    generateItem: () => ({
      id: faker.string.uuid(),
      configGroup: faker.helpers.arrayElement(['SYSTEM', 'BUSINESS', 'SECURITY']),
      configKey: faker.commerce.productName().toLowerCase().replace(/\s+/g, '_'),
      configValue: faker.lorem.word(),
      valueType: faker.helpers.arrayElement(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
      defaultValue: '',
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['ENABLED', 'DISABLED']),
      createdBy: 'admin',
      createdAt: faker.date.past().toISOString(),
      updatedBy: 'admin',
      updatedAt: faker.date.recent().toISOString(),
    }),
    listSize: 15,
    enableDelay: true,
  });

  // 3. 认证相关 Mock
  const authHandlers = [
    // 登录
    http.post('/api/v1/auth/login', async () => {
      await delay(faker.number.int({ min: 100, max: 500 }));
      return HttpResponse.json({
        code: 'A00000',
        msg: '操作成功',
        data: {
          accessToken: 'mock-access-token-' + faker.string.uuid(),
          refreshToken: 'mock-refresh-token-' + faker.string.uuid(),
          expiresIn: 7200,
          userInfo: {
            userId: 'mock-user-001',
            username: 'admin',
            realName: '系统管理员',
            email: 'admin@ydsz.com',
            roleCode: 'admin',
            tenantId: 'default',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            roles: ['admin'],
            permissions: ['*'],
          },
        },
        traceId: faker.string.uuid(),
        timestamp: Date.now(),
      });
    }),

    // 获取用户信息
    http.get('/api/v1/auth/userinfo', async () => {
      await delay(faker.number.int({ min: 50, max: 200 }));
      return HttpResponse.json({
        code: 'A00000',
        msg: '操作成功',
        data: {
          userId: 'mock-user-001',
          username: 'admin',
          realName: '系统管理员',
          email: 'admin@ydsz.com',
          roleCode: 'admin',
          tenantId: 'default',
        },
        traceId: faker.string.uuid(),
        timestamp: Date.now(),
      });
    }),

    // 登出
    http.post('/api/v1/auth/logout', async () => {
      await delay(faker.number.int({ min: 50, max: 200 }));
      return HttpResponse.json({
        code: 'A00000',
        msg: '操作成功',
        data: null,
        traceId: faker.string.uuid(),
        timestamp: Date.now(),
      });
    }),
  ];

  // 4. 合并所有 handlers
  const allHandlers = [...autoHandlers, ...customHandlers, ...authHandlers];

  // 5. 启动 Mock Server
  await setupMockServer(allHandlers, {
    onUnhandledRequest: 'bypass',
  });

  logger.info(`MSW Server 已启动，共 ${allHandlers.length} 个处理器`);
}
