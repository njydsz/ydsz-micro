/**
 * Playwright E2E 配置 — Agent 子应用（云顶编码规范 §16.10 第三阶段）。
 *
 * <b>3 个前端核心用例（Phase 3 目标）：</b>
 * <ol>
 *   <li>登录 → 鉴权 → Agent 列表导航</li>
 *   <li>创建 Agent → 配置保存 → 调试台对话</li>
 *   <li>消息通知 → 查看确认 → 列表刷新</li>
 * </ol>
 *
 * @path apps/agent-web/playwright.config.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = 5610;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // 并行 + 重试（CI 环境 flaky 控制）
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // HTML + JUnit 双输出，JUnit 供 CI 归档
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-html', open: 'never' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
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
    // 多浏览器覆盖在 Phase 4 按需装配：firefox / webkit
  ],
  // 本地开发时由 test:e2e 脚本前置启动 dev server；CI 中独立启动已够用
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
