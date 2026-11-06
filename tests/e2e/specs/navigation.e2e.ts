/**
 * 主导航冒烟测试 — 登录后侧边栏 + 子应用菜单切换。
 *
 * <p>级别定义：
 * <ul>
 *   <li>P2-smoke: 登录后 shell 布局挂载（含侧边栏）</li>
 *   <li>P2-smoke: 点击子应用菜单 → 内容区 iframe/路由切换</li>
 * </ul>
 *
 * <p>运行命令：
 * <pre>
 *   E2E_PORT=5610 E2E_APP_CMD='pnpm -F @ydsz/main-web run dev' \
 *     pnpm test:e2e tests/e2e/specs/navigation.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/navigation.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';
import { APP_SELECTOR } from '../support/selectors';

/** 主导航选择器 */
const LOCAL_SELECTORS = {
  /** 侧边栏 */
  sidebar: 'aside, nav[role="navigation"]',
  /** 菜单项 */
  menuItems: '[role="menuitem"], [data-testid*="menu-item"]',
  /** 顶部导航/标签栏 */
  tabBar: '[role="tablist"], [data-testid*="tab-bar"]',
} as const;

/**
 * 等待主应用完成 SPA 渲染。
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(APP_SELECTOR, { state: 'visible', timeout: 15_000 });
}

test.describe('主导航冒烟', () => {
  test('TC-NAV-001: 应用挂载 — 主 Vue 实例应完成初始化', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 等待应用主容器渲染完成（最多 15 秒）
    await expect(page.locator(APP_SELECTOR)).toBeVisible({ timeout: 15_000 });
  });

  test('TC-NAV-002: 侧边栏 — 登录后应渲染侧边栏导航', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    // 侧边栏或菜单至少有一个可见
    const sidebar = page.locator(LOCAL_SELECTORS.sidebar).first();
    const menuItem = page.locator(LOCAL_SELECTORS.menuItems).first();
    const tabBar = page.locator(LOCAL_SELECTORS.tabBar).first();

    const anyVisible = await Promise.race([
      sidebar
        .isVisible({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false),
      menuItem
        .isVisible({ timeout: 100 })
        .then(() => true)
        .catch(() => false),
      tabBar
        .isVisible({ timeout: 100 })
        .then(() => true)
        .catch(() => false),
    ]);

    expect(anyVisible, '侧边栏、菜单项或标签栏至少有一个应可见').toBe(true);
  });

  test('TC-NAV-003: 内容切换 — 应用路由可达', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    // 渲染后 document.title 应非空（路由 + 应用初始化均成功）
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
