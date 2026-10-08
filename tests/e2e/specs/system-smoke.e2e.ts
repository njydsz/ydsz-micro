/**
 * System 模块烟雾测试 — 字典类型、系统配置、租户管理核心 browse-add 流程。
 *
 * <p>运行前需启动 system-web 开发服务：
 * <pre>
 *   E2E_PORT=5602 E2E_APP_CMD='pnpm -F @ydsz/system-web run dev' pnpm test:e2e tests/e2e/specs/system-smoke.e2e.ts
 * </pre>
 *
 * <p>每个 test 验证「访问 → 等待列表渲染 → 点击新增按钮 → 校验表单/对话框」的三步流程。
 *
 * @path tests/e2e/specs/system-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理（UI 变更时统一调整） */
const SELECTORS = {
  /** 应用主容器 — Vue 挂载完成的标志 */
  appContainer: '.app-container',
  /** 数据表格（统一管理台表格组件） */
  dataTable: '.el-table',
  /** 新增按钮（"+" / "新增" / "新建" 按钮） */
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加")',
  /** 对话框（Element Plus 弹出层） */
  dialog: '.el-dialog',
  /** 对话框中的保存/提交按钮 */
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定")',
  /** 表单校验错误提示 */
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

test.describe('System 模块 — 字典类型管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/system/dict-type', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-SYS-001: 页面访问 — 应成功导航且标题显示「字典类型」', async ({ page }) => {
    // 页面主体应渲染
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();

    // 面包屑或页面标题中包含"字典类型"
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /字典类型/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-SYS-002: 列表加载 — 表格或列表容器应可见', async ({ page }) => {
    // 等待表格渲染或空状态出现
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');

    // 表格或空状态至少有一个可见（API 失败时展示空状态也属于正常渲染）
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-SYS-003: 新增按钮 — 点击后应弹出新增表单对话框', async ({ page }) => {
    // 点击新增按钮
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // 对话框应弹出
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });

    // 对话框应包含表单字段
    const dialogContent = page.locator(SELECTORS.dialog);
    const inputCount = await dialogContent.locator('input, textarea').count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('TC-SYS-004: 表单校验 — 空表单提交时应显示校验提示', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    const dialog = page.locator(SELECTORS.dialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // 直接点击保存按钮（不填任何字段）
    const saveBtn = page.locator(SELECTORS.dialogSave).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      // 校验错误提示应出现
      await expect(page.locator(SELECTORS.formError).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('System 模块 — 系统配置管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/system/config', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-SYS-005: 页面访问 — 应成功渲染系统配置页面', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-SYS-006: 列表加载 — 配置列表或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-SYS-007: 新增按钮 — 应弹出配置新增对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('System 模块 — 租户管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/tenant/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-SYS-008: 页面访问 — 应成功渲染租户列表页面', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-SYS-009: 列表加载 — 租户表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-SYS-010: 新增按钮 — 点击弹出新增租户对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
