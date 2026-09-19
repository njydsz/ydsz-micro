/**
 * 视觉回归（Visual Regression）冒烟测试。
 *
 * <p>基于 Playwright 内置 toHaveScreenshot() 进行像素级基线对比。
 * 首次运行生成基线截图（需 pnpm test:visual --update-snapshots），
 * 后续运行自动与基线比对 → 差异超阈值则测试失败。
 *
 * <p>容差：maxDiffPixelRatio ≤ 0.01（允许 1% 像素差异，兼容不同平台抗锯齿）。
 *
 * <p>基线图片目录：tests/visual/__screenshots__/
 * 基线随仓库提交，CI 直接使用。
 *
 * @path tests/visual/smoke.spec.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import { test, expect } from '@playwright/test';

/** 视觉差异阈值 - 允许 1% 像素差异 */
const MAX_DIFF_PIXEL_RATIO = 0.01;

/** 基线截图公共选项 */
const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  // 禁用 caret 与 caret 闪烁导致的差异
  caret: 'hide',
  // 隐藏动画减少伪差异
  animations: 'disabled',
} as const;

test.describe('ydsz-ui 视觉回归', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-visual-fixture="ready"]', { timeout: 15_000 });
  });

  test('Button 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-button')).toHaveScreenshot('button.png', SNAPSHOT_OPTIONS);
  });

  test('Input 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-input')).toHaveScreenshot('input.png', SNAPSHOT_OPTIONS);
  });

  test('Select 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-select')).toHaveScreenshot('select.png', SNAPSHOT_OPTIONS);
  });

  test('Table 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-table')).toHaveScreenshot('table.png', SNAPSHOT_OPTIONS);
  });

  test('Card 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-card')).toHaveScreenshot('card.png', SNAPSHOT_OPTIONS);
  });

  test('Alert 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-alert')).toHaveScreenshot('alert.png', SNAPSHOT_OPTIONS);
  });

  test('Dialog 组件视觉基线', async ({ page }) => {
    await expect(page.getByTestId('vrs-dialog')).toHaveScreenshot('dialog.png', SNAPSHOT_OPTIONS);
  });

  test('整页视觉基线', async ({ page }) => {
    await expect(page).toHaveScreenshot('full-page.png', {
      ...SNAPSHOT_OPTIONS,
      fullPage: true,
    });
  });
});
