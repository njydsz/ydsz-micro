/**
 * Message 模块烟雾测试 — 消息管理、模板管理、通知管理核心 browse-add 流程。
 *
 * <p>运行前需启动 message-web 开发服务：
 * <pre>
 *   E2E_PORT=5604 E2E_APP_CMD='pnpm -F @ydsz/message-web run dev' pnpm test:e2e tests/e2e/specs/message-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/message-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加")',
  dialog: '.el-dialog',
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定")',
  formError: '.el-form-item__error',
} as const;

/**
 * 等待应用完成 SPA 渲染。
 *
 * @param page - Playwright 页面实例
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.appContainer, { state: 'visible', timeout: 15_000 });
}

test.describe('Message 模块 — 消息列表', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/message/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-MSG-001: 页面访问 — 应成功导航至消息列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /消息/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-MSG-002: 列表加载 — 消息表格或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-MSG-003: 新增按钮 — 点击后应弹出新增消息对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Message 模块 — 模板管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/template/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-MSG-004: 页面访问 — 应成功渲染模板管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /模板/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-MSG-005: 列表加载 — 模板表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-MSG-006: 新增按钮 — 点击弹出新增模板对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Message 模块 — 通知管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/notification/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-MSG-007: 页面访问 — 应成功渲染通知管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-MSG-008: 列表加载 — 通知表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-MSG-009: 新增按钮 — 点击弹出新增通知对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
