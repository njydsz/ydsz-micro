/**
 * Message Web Mock 配置
 *
 * <p>基于 @ydsz/mock-service 提供类型安全的 API Mock。
 * 开发环境设置 VITE_USE_MOCK=true 启用。
 *
 * <p>前置条件：执行 `pnpm mock:init` 在 public/ 下生成 mockServiceWorker.js。
 *
 * @path apps/message-web/src/mock/index.ts
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
import spec from '../api/sdk/openapi.json';

/** 消息通道枚举（与后端 ChannelEnum 对齐） */
const CHANNELS = ['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK'] as const;

/** 消息状态枚举 */
const MESSAGE_STATUSES = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'] as const;

/**
 * 初始化 Message Web Mock Server
 *
 * <p>在 main.ts 中调用，需要配合环境变量 VITE_USE_MOCK=true 使用。
 */
export async function initMessageMockServer(): Promise<void> {
  // 1. 从 OpenAPI spec 自动生成基础 handlers（覆盖 /api/v1/message/** 92 个端点）
  const autoHandlers = generateMockHandlers(spec as object, {
    enableDelay: true,
    listSize: 10,
    seed: 12345, // 固定种子，确保可重复
  });

  // 2. 自定义消息记录 CRUD（覆盖自动生成，字段与业务模型对齐）
  const customHandlers = createCrudHandlers('/api/v1/message/log', {
    generateItem: () => ({
      logId: faker.string.uuid(),
      messageId: faker.string.uuid(),
      channel: faker.helpers.arrayElement([...CHANNELS]),
      receiver: faker.internet.email(),
      templateCode: faker.helpers.arrayElement([
        'VERIFY_CODE',
        'ORDER_NOTICE',
        'SYSTEM_ALERT',
      ]),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement([...MESSAGE_STATUSES]),
      retryCount: faker.number.int({ min: 0, max: 3 }),
      sentAt: faker.date.recent().toISOString(),
      createdAt: faker.date.past().toISOString(),
    }),
    listSize: 15,
    enableDelay: true,
  });

  // 3. 认证相关 Mock（子应用独立调试时使用，与主应用联调时被真实接口接管）
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

  console.info('[Message Mock] MSW Server 已启动，共 %d 个处理器', allHandlers.length);
}
