/**
 * Mock 服务器 — 用于 standalone 开发模式
 *
 * 拦截 API 请求并返回模拟数据，使子应用可在无后端环境下独立开发。
 *
 * 基于简单的 monkey-patch fetch 实现。
 * 对于生产级需求，建议替换为 MSW (https://mswjs.io/)
 *
 * @path apps/userinfo-web/src/mock/setup.ts
 * @author remi-team
 * @since 4.0.0
 */

import { mockAuthHandlers } from './handlers/auth';
import { mockUserHandlers } from './handlers/users';

/** Mock 处理器注册表 */
const handlers = [
  ...mockAuthHandlers,
  ...mockUserHandlers,
];

/**
 * 简单的 fetch monkey-patch mock服务器
 */
export async function setupMockServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method?.toUpperCase() || 'GET';

    // 匹配 mock 处理器
    for (const handler of handlers) {
      if (handler.test(url, method)) {
        try {
          const result = await handler.handle(url, init);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({ message: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 未匹配的走原始 fetch
    return originalFetch(input, init as RequestInit);
  };

  console.info('[Mock] Fetch monkey-patch enabled for standalone mode');
}
