/**
 * Playwright 配置 — 视觉回归测试（Visual Regression Testing）。
 *
 * <p>对 ydsz-ui 关键组件进行截图基线对比，确保 UI 变更不引入意外的视觉差异。
 * 采用 Playwright 内置 toHaveScreenshot() + 像素差异阈值，无需外部服务。
 *
 * <p>运行命令：
 * <ul>
 *   <li>本地更新基线：{@code pnpm test:visual --update-snapshots}</li>
 *   <li>本地验证：{@code pnpm test:visual}</li>
 *   <li>CI：由 .github/workflows/ci.yml visual job 触发</li>
 * </ul>
 *
 * <p>受测组件清单（与 a11y fixture 一致，确保视觉 + 可访问性双覆盖）：
 *   Button / Input / Select / Table / Dialog / Sheet
 *
 * <p>容差策略：
 *   - maxDiffPixelRatio ≤ 0.01（允许 1% 像素差异，兼容抗锯齿渲染差异）
 *   - 不纳入 color-contrast 规则（axe 负责），仅检测布局/结构变化
 *
 * @path playwright.visual.config.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import { defineConfig, devices } from '@playwright/test';

const FIXTURE_PORT = 4311;
const FIXTURE_URL = `http://localhost:${FIXTURE_PORT}`;

export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/visual-html', open: 'never' }],
    ['junit', { outputFile: 'test-results/visual-junit.xml' }],
    ['list'],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FIXTURE_URL,
    trace: 'on-first-retry',
    screenshot: 'on',
    viewport: { width: 1280, height: 720 },
    // 视觉回归必须在固定视口 + 禁用动画以确保可比性
    // 使用 prefers-reduced-motion 兼容级别
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  webServer: {
    command: 'pnpm vite --config tests/visual/vite.config.ts --port 4311 --strictPort',
    url: FIXTURE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
