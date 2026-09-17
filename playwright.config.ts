/**
 * Playwright 配置 — 无障碍自动化冒烟测试（云顶编码规范 §16.10 第四阶段）。
 *
 * <p>独立于 apps/agent-web/playwright.config.ts 运行，专用于 a11y 扫描。
 * webServer 使用 Vite 服务 tests/a11y/fixtures/index.html，
 * 渲染 ydsz-ui 关键组件的标准用法供 axe-core 扫描。
 *
 * <p>运行命令：{@code pnpm test:a11y}
 * <ul>
 *   <li>本地：{@code pnpm test:a11y}（自动启动 fixture 服务 + Chromium）</li>
 *   <li>CI  : 由 .github/workflows/ci.yml accessibility job 触发</li>
 * </ul>
 *
 * @path playwright.config.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { defineConfig, devices } from '@playwright/test';

const FIXTURE_PORT = 4310;
const FIXTURE_URL = `http://localhost:${FIXTURE_PORT}`;

export default defineConfig({
  testDir: './tests/a11y',
  testMatch: '**/*.spec.ts',
  // a11y 测试串行运行，避免并发干扰 DOM 扫描
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // HTML + JUnit 双输出，JUnit 供 CI 归档；list 输出便于本地调试
  reporter: [
    ['html', { outputFolder: 'test-results/a11y-html', open: 'never' }],
    ['junit', { outputFile: 'test-results/a11y-junit.xml' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FIXTURE_URL,
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
    command: 'pnpm vite --config tests/a11y/vite.config.ts --port 4310 --strictPort',
    url: FIXTURE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
