/**
 * Cronjob 模块烟雾测试 — 任务列表、任务分组、执行日志核心 browse-add 流程。
 *
 * <p>运行前需启动 cronjob-web 开发服务：
 * <pre>
 *   E2E_PORT=5605 E2E_APP_CMD='pnpm -F @ydsz/cronjob-web run dev' pnpm test:e2e tests/e2e/specs/cronjob-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/cronjob-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("创建任务")',
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

test.describe('Cronjob 模块 — 任务列表', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/job/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-CRON-001: 页面访问 — 应成功导航至任务列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /任务/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-CRON-002: 列表加载 — 任务表格或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-CRON-003: 新增按钮 — 点击后应弹出新增任务对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Cronjob 模块 — 任务分组', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/job/group', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-CRON-004: 页面访问 — 应成功渲染任务分组管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-CRON-005: 列表加载 — 分组列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-CRON-006: 新增按钮 — 点击弹出新增分组对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Cronjob 模块 — 执行日志', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/log/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-CRON-007: 页面访问 — 应成功渲染执行日志列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-CRON-008: 列表加载 — 日志表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-CRON-009: 新增按钮（如有）— 不阻塞日志页面渲染', async ({ page }) => {
    // 执行日志页可能无新增按钮；验证页面渲染完整即可
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const table = page.locator(SELECTORS.dataTable);
    await expect(table).toBeVisible({ timeout: 5_000 });
  });
});
