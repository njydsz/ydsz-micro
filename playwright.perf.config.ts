/**
 * Playwright 配置 — Web Vitals 性能门禁（云顶编码规范 §15.8 / §18.5）。
 *
 * <p>为什么单独立一份配置，而不是复用 playwright.config.ts：
 * 后者是 a11y 冒烟配置，testDir 指向 tests/a11y，webServer 起的是 4310 端口的
 * fixture 页面。performance.yml 此前不带 --config 直接跑 tests/performance 下的用例，
 * 实际拿到的是这份 a11y 配置 —— 结果要么是"过滤后 0 条用例"（门禁静默空转），
 * 要么侥幸命中时测的是 a11y fixture 页面而不是 main-web 产物（数据完全失真）。
 *
 * <p>这里 webServer 用 vite preview 服务 main/dist 真实生产产物，测的才是要发布的东西。
 * 前置条件：先跑 pnpm build:main。
 *
 * <p>运行命令：{@code pnpm test:perf}
 *
 * @path playwright.perf.config.ts
 * @author ydsz-team
 * @since 5.2.0
 */

import { defineConfig, devices } from '@playwright/test';

const PERF_PORT = 4320;
const PERF_URL = `http://localhost:${PERF_PORT}`;

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '**/*.spec.ts',
  outputDir: 'test-results/perf',
  // 性能测量必须串行：并发会互相抢 CPU/网络，测出来的 LCP 不可比
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // 重测会重写指标 JSON 并掩盖抖动，性能门禁宁可显式失败也不重试
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/perf-html', open: 'never' }],
    ['junit', { outputFile: 'test-results/perf-junit.xml' }],
    ['list'],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: PERF_URL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm -F @ydsz/main-web run preview --port ${PERF_PORT} --strictPort`,
    url: PERF_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
