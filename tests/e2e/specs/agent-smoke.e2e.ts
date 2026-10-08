/**
 * Agent 模块烟雾测试 — Agent管理、RAG知识库、DAG编排、工具管理核心 browse-add 流程。
 *
 * <p>运行前需启动 agent-web 开发服务：
 * <pre>
 *   E2E_PORT=5610 E2E_APP_CMD='pnpm -F @ydsz/agent-web run dev' pnpm test:e2e tests/e2e/specs/agent-smoke.e2e.ts
 * </pre>
 *
 * <p>注意：本文件与 apps/agent-web/e2e/agent-management.e2e.ts 互斥运行，
 * 前者为 Phase 3 骨架（带 describe.skip），本文件为跨模块统一 smoke specs。
 *
 * @path tests/e2e/specs/agent-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理 */
const SELECTORS = {
  appContainer: '.app-container',
  dataTable: '.el-table',
  cardGrid: '[data-testid="agent-card-grid"], .card-grid',
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("创建Agent"), button:has-text("新建Agent")',
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

test.describe('Agent 模块 — Agent管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/agent/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-AGT-001: 页面访问 — 应成功导航至Agent列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /Agent|智能体/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-AGT-002: 列表加载 — Agent卡片网格或表格应可见', async ({ page }) => {
    const grid = page.locator('button:has-text("卡片")').or(page.locator(SELECTORS.cardGrid));
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(grid.or(table).or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-AGT-003: 新增按钮 — 点击弹出新建Agent对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Agent 模块 — RAG知识库', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/rag/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-AGT-004: 页面访问 — 应成功渲染知识库管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /知识库|RAG/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-AGT-005: 列表加载 — 知识库列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-AGT-006: 新增按钮 — 点击弹出新建知识库对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Agent 模块 — DAG编排', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/dag/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-AGT-007: 页面访问 — 应成功渲染DAG列表页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
    const heading = page.locator('h1, h2, .page-title, .el-page-header__title');
    await expect(heading.filter({ hasText: /DAG|编排/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-AGT-008: 列表加载 — DAG列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-AGT-009: 新增按钮 — 点击弹出新建DAG对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Agent 模块 — 工具管理', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/tool/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-AGT-010: 页面访问 — 应成功渲染工具管理页', async ({ page }) => {
    await expect(page.locator(SELECTORS.appContainer)).toBeVisible();
  });

  test('TC-AGT-011: 列表加载 — 工具列表应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator('.el-table__empty-text');
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-AGT-012: 新增按钮 — 点击弹出新增工具对话框', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});
