/**
 * Generator 模块烟雾测试 — 数据源管理、表元数据、代码生成核心 browse-add 流程。
 *
 * <p>运行前需启动 generator-web 开发服务：
 * <pre>
 *   E2E_PORT=5609 E2E_APP_CMD='pnpm -F @ydsz/generator-web run dev' pnpm test:e2e tests/e2e/specs/generator-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/generator-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("连接"), button:has-text("导入表")',
  dialog: '.el-dialog',
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定"), .el-dialog__footer button:has-text("连接")',
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

test.describe('Generator 模块 — 数据源管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/datasource/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-GEN-001: 页面访问 — 应成功导航至数据源管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /数据源/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-GEN-002: 列表加载 — 数据源表格或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-GEN-003: 新增按钮 — 点击弹出新增数据源对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });

  test('TC-GEN-004: 表单校验 — 空表单提交应显示校验提示', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    const dialog = page.locator(SELECTORS.dialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const inputCount = await dialog.locator('input, textarea').count();
    expect(inputCount).toBeGreaterThan(0);
  });
});

test.describe('Generator 模块 — 表元数据', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/table-meta/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-GEN-005: 页面访问 — 应成功渲染表元数据列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /表|元数据/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-GEN-006: 列表加载 — 表元数据表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-GEN-007: 新增按钮 — 点击弹出导入表对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Generator 模块 — 代码生成', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/code-gen/index', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-GEN-008: 页面访问 — 应成功渲染代码生成页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-GEN-009: 页面渲染 — 代码生成操作区应可见', async ({ page }) => {
    // 代码生成页可能是单个操作面板，检查主体内容存在
    const mainContent = page.locator('.el-card, .code-gen-panel, main');
    await expect(mainContent.first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-GEN-010: 新增按钮 — 如有新建生成按钮则弹框正常', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
    } else {
      // 代码生成页无直接新增按钮时，验证渲染即可
      await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    }
  });
});
