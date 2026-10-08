/**
 * Workflow 模块烟雾测试 — 流程分类、流程模板、流程实例核心 browse-add 流程。
 *
 * <p>运行前需启动 workflow-web 开发服务：
 * <pre>
 *   E2E_PORT=5606 E2E_APP_CMD='pnpm -F @ydsz/workflow-web run dev' pnpm test:e2e tests/e2e/specs/workflow-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/workflow-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("创建")',
  dialog: '.el-dialog',
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定"), .el-dialog__footer button:has-text("发布")',
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

test.describe('Workflow 模块 — 流程分类', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/template/category', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WF-001: 页面访问 — 应成功导航至流程分类页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /分类/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-WF-002: 列表加载 — 分类列表（树形或表格）应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const tree = page.locator('.el-tree');
    const emptyText = page.locator('.el-table__empty-text, .el-tree__empty-text');
    await expect(table.or(tree).or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WF-003: 新增按钮 — 点击弹出新增分类对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Workflow 模块 — 流程模板', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/template/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WF-004: 页面访问 — 应成功渲染流程模板列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /模板/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-WF-005: 列表加载 — 模板表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WF-006: 新增按钮 — 点击弹出新增模板对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Workflow 模块 — 流程实例', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/flow/instance', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-WF-007: 页面访问 — 应成功渲染流程实例列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-WF-008: 列表加载 — 实例表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-WF-009: 新增按钮 — 点击弹出新增实例对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
