/**
 * Userinfo 模块烟雾测试 — 用户管理、角色管理、部门管理核心 browse-add 流程。
 *
 * <p>运行前需启动 userinfo-web 开发服务：
 * <pre>
 *   E2E_PORT=5601 E2E_APP_CMD='pnpm -F @ydsz/userinfo-web run dev' pnpm test:e2e tests/e2e/specs/userinfo-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/userinfo-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("创建用户")',
  dialog: '.el-dialog',
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定"), .el-dialog__footer button:has-text("创建")',
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

test.describe('Userinfo 模块 — 用户管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/organization/user', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-USER-001: 页面访问 — 应成功导航至用户管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /用户/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-USER-002: 列表加载 — 用户表格或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-USER-003: 新增按钮 — 点击后应弹出新增用户对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });

  test('TC-USER-004: 表单校验 — 空表单提交应显示校验提示', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    const dialog = page.locator(SELECTORS.dialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const saveBtn = page.locator(SELECTORS.dialogSave).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(page.locator(SELECTORS.formError).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Userinfo 模块 — 角色管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/organization/role', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-USER-005: 页面访问 — 应成功渲染角色管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-USER-006: 列表加载 — 角色表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-USER-007: 新增按钮 — 点击弹出新增角色对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Userinfo 模块 — 部门管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/organization/dept', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-USER-008: 页面访问 — 应成功渲染部门管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-USER-009: 列表加载 — 部门列表（树形或表格）应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const tree = page.locator('.el-tree');
    const emptyText = page.locator('.el-table__empty-text, .el-tree__empty-text');
    await expect(table.or(tree).or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-USER-010: 新增按钮 — 点击弹出新增部门对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
