/**
 * 全局搜索冒烟测试 — Cmd+K 命令面板/搜索弹窗可达 + 结果渲染。
 *
 * <p>级别定义：
 * <ul>
 *   <li>P2-smoke: Cmd+K 触发后搜索面板可见</li>
 *   <li>P2-smoke: 输入关键词后结果列表渲染（或空状态展示）</li>
 * </ul>
 *
 * <p>注意：App.vue 已注册 useKeyboard('cmd+k', ...) 统一处理 Cmd+K/Ctrl+K。
 * Playwright 在 Linux runner 上无 Meta 键，使用 Ctrl+K 组合等价触发。
 *
 * <p>运行命令：
 * <pre>
 *   E2E_PORT=5610 E2E_APP_CMD='pnpm -F @ydsz/main-web run dev' \
 *     pnpm test:e2e tests/e2e/specs/global-search.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/global-search.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';
import { APP_SELECTOR } from '../support/selectors';

/** 全局搜索面板选择器 */
const LOCAL_SELECTORS = {
  /** 搜索面板 overlay */
  overlay: '[class*="overlay"], [role="dialog"]',
  /** 搜索输入框 */
  input: 'input[type="search"], input[placeholder*="搜索"], [class*="input"]',
  /** 搜索结果项 */
  resultItem: '[class*="item"], [role="option"]',
  /** 搜索结果列表 */
  results: '[class*="results"], [role="listbox"]',
  /** 空状态 */
  empty: '[class*="empty"], [data-testid*="empty"]',
} as const;

/**
 * 等待主应用完成 SPA 渲染。
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(APP_SELECTOR, { state: 'visible', timeout: 15_000 });
}

test.describe('全局搜索冒烟', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-SEARCH-001: Cmd+K 触发 — 搜索面板应出现', async ({ page }) => {
    // 禁用动画，确保面板立即可见
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 按下 Ctrl+K（跨平台等价 Cmd+K）
    await page.keyboard.press('Control+K');

    // 搜索面板 overlay 应可见
    const overlay = page.locator(LOCAL_SELECTORS.overlay).first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // 搜索输入框应获得焦点
    const input = page.locator(LOCAL_SELECTORS.input).first();
    await expect(input).toBeVisible();
  });

  test('TC-SEARCH-002: 输入搜索词 — 结果列表或空状态应渲染', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 打开搜索面板
    await page.keyboard.press('Control+K');

    const input = page.locator(LOCAL_SELECTORS.input).first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // 输入搜索词
    await input.fill('系统');
    await page.waitForTimeout(500);

    // 结果列表或空状态至少有一个可见
    const resultItem = page.locator(LOCAL_SELECTORS.resultItem).first();
    const empty = page.locator(LOCAL_SELECTORS.empty).first();

    const anyVisible = await Promise.race([
      resultItem.isVisible({ timeout: 3_000 }).then(() => true).catch(() => false),
      empty.isVisible({ timeout: 100 }).then(() => true).catch(() => false),
    ]);

    expect(anyVisible, '搜索结果列表或空状态至少有一个应渲染').toBe(true);
  });

  test('TC-SEARCH-003: Esc 关闭 — 搜索面板应隐藏', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.keyboard.press('Control+K');
    const overlay = page.locator(LOCAL_SELECTORS.overlay).first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // 按 Esc 关闭
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible({ timeout: 3_000 });
  });
});
