/**
 * Playwright 配置 — 冒烟 E2E + a11y 扫描
 *
 * 测试目标（v4.4.0 起落地，替代此前空置的 e2e/ 目录）：
 * 1. 主应用可启动并可路由（登录页渲染、无致命控制台错误）
 * 2. 主链路 a11y 基线扫描（@axe-core/playwright，对标 ADR-005）
 *
 * webServer 直接复用 main 的 Vite dev server（5600），
 * 子应用由 micro-kernel 按需 dev 加载，冒烟阶段不强制全量起服。
 *
 * CI：见 .github/workflows/ci.yml e2e-smoke job（默认手动触发）。
 *
 * @path e2e/playwright.config.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import { defineConfig, devices } from '@playwright/test';

const MAIN_WEB_URL = process.env.E2E_MAIN_URL ?? 'http://localhost:5600';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: MAIN_WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: 'pnpm --filter @ydsz/main-web run dev',
        url: MAIN_WEB_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
