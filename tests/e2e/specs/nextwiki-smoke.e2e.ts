/**
 * Nextwiki 模块烟雾测试 — 文件管理、空间管理、标签管理核心 browse-add 流程。
 *
 * <p>运行前需启动 nextwiki-web 开发服务：
 * <pre>
 *   E2E_PORT=5607 E2E_APP_CMD='pnpm -F @ydsz/nextwiki-web run dev' pnpm test:e2e tests/e2e/specs/nextwiki-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/nextwiki-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';
import { APP_SELECTOR, SELECTORS } from '../support/selectors';

/** 选择器集中管理 */
const LOCAL_SELECTORS = {
  createButton:
    'button:has-text("上传"), button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("新建空间")',
} as const;

/**
 * 等待应用完成 SPA 渲染。
 *
 * @param page - Playwright 页面实例
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(APP_SELECTOR, { state: 'visible', timeout: 15_000 });
}

test.describe('Nextwiki 模块 — 文件管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/file/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WIKI-001: 页面访问 — 应成功导航至文件列表页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
    const heading = page.locator(SELECTORS.heading);
    await expect(heading.filter({ hasText: /文件/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-WIKI-002: 列表加载 — 文件列表（表格或卡片）应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const cardGrid = page.locator('.card-grid, .file-grid');
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(cardGrid).or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WIKI-003: 新增按钮 — 点击弹出上传/新增文件对话框', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Nextwiki 模块 — 空间管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/space/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WIKI-004: 页面访问 — 应成功渲染空间管理页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
    const heading = page.locator(SELECTORS.heading);
    await expect(heading.filter({ hasText: /空间/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-WIKI-005: 列表加载 — 空间列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WIKI-006: 新增按钮 — 点击弹出新建空间对话框', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Nextwiki 模块 — 标签管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/tag/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WIKI-007: 页面访问 — 应成功渲染标签管理页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
  });

  test('TC-WIKI-008: 列表加载 — 标签列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WIKI-009: 新增按钮 — 点击弹出新增标签对话框', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
