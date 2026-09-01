/**
 * @ydsz/mock-service — MSW Worker 启动器（浏览器端）
 *
 * <p>封装 MSW browser worker 的生命周期，应用入口按需调用。
 *
 * <p>前置条件：执行 `pnpm mock:init`（即 `msw init public/`）在 public/ 下
 * 生成 mockServiceWorker.js。文件缺失时本模块降级为 warn，不阻塞应用启动。
 *
 * @path comm/effects/mock-service/src/server.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';

/** 当前 worker 实例（用于生命周期管理） */
let activeWorker: ReturnType<typeof setupWorker> | null = null;

/**
 * 启动 MSW Service Worker
 *
 * <p>public/mockServiceWorker.js 缺失时降级为 console.warn，不抛出异常。
 *
 * @param handlers - 请求处理器列表
 * @param options - onUnhandledRequest: 'bypass' 时未匹配请求直接放行
 */
export async function setupMockServer(
  handlers: RequestHandler[],
  options: { onUnhandledRequest?: 'bypass' | 'warn' | 'error' } = {},
): Promise<void> {
  const worker = setupWorker(...handlers);

  try {
    await worker.start({
      quiet: true,
      onUnhandledRequest: options.onUnhandledRequest ?? 'bypass',
    });
    activeWorker = worker;
  } catch (error) {
    console.warn(
      '[Mock Service] MSW Worker 启动失败（检查是否已执行 `pnpm mock:init` 生成 public/mockServiceWorker.js），已降级为直连模式。',
      error,
    );
  }
}

/**
 * 停止 MSW Service Worker
 */
export async function closeMockWorker(): Promise<void> {
  if (activeWorker) {
    activeWorker.stop();
    activeWorker = null;
  }
}
