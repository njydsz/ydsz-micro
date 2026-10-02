/**
 * Playwright E2E 烟雾测试配置 — 全模块冒烟测试基础设施
 *
 * <p>提供共享的 Playwright 配置模板，各 app 可通过项目矩阵引用。
 * webServer 使用 Vite dev 服务（{APP_CMD} 占位符由具体测试替换）。
 *
 * <p>运行命令：
 * <ul>
 *   <li>本地全套：<code>pnpm test:e2e</code></li>
 *   <li>单模块：<code>pnpm test:e2e:agent</code></li>
 * </ul>
 *
 * @path tests/e2e/playwright.config.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 5610);
const BASE_URL = `http://localhost:${PORT}`;
const APP_CMD = process.env.E2E_APP_CMD ?? 'pnpm dev';

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.e2e.ts',
  // 串行运行（减少资源竞争）
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-html', open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: APP_CMD,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
