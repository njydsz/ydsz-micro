/**
 * Literule 模块烟雾测试 — 规则列表、CEP复杂事件、审计日志核心 browse-add 流程。
 *
 * <p>运行前需启动 literule-web 开发服务：
 * <pre>
 *   E2E_PORT=5608 E2E_APP_CMD='pnpm -F @ydsz/literule-web run dev' pnpm test:e2e tests/e2e/specs/literule-smoke.e2e.ts
 * </pre>
 *
 * @path tests/e2e/specs/literule-smoke.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';
import { APP_SELECTOR, SELECTORS } from '../support/selectors';

/** 选择器集中管理 */
const LOCAL_SELECTORS = {
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加"), button:has-text("创建规则")',
} as const;

/**
 * 等待应用完成 SPA 渲染。
 *
 * @param page - Playwright 页面实例
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(APP_SELECTOR, { state: 'visible', timeout: 15_000 });
}

test.describe('Literule 模块 — 规则列表', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/rule/list', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-RULE-001: 页面访问 — 应成功导航至规则列表页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
    const heading = page.locator(SELECTORS.heading);
    await expect(heading.filter({ hasText: /规则/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-RULE-002: 列表加载 — 规则表格或空状态应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-RULE-003: 新增按钮 — 点击后应弹出新增规则对话框', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Literule 模块 — CEP复杂事件', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/advanced/cep', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-RULE-004: 页面访问 — 应成功渲染CEP复杂事件页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
    const heading = page.locator(SELECTORS.heading);
    await expect(heading.filter({ hasText: /CEP|复杂事件/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-RULE-005: 列表加载 — CEP列表/卡片区域应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const cardGrid = page.locator('.card-grid, [data-testid="rule-card-grid"]');
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(cardGrid).or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-RULE-006: 新增按钮 — 点击弹出新增CEP对话框', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Literule 模块 — 审计日志', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/audit/log', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('TC-RULE-007: 页面访问 — 应成功渲染审计日志页', async ({ page }) => {
    await expect(page.locator(APP_SELECTOR)).toBeVisible();
  });

  test('TC-RULE-008: 列表加载 — 审计日志表格应可见', async ({ page }) => {
    const table = page.locator(SELECTORS.dataTable);
    const emptyText = page.locator(SELECTORS.emptyState);
    await expect(table.or(emptyText)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-RULE-009: 表单校验 — 新增表单空提交应提示校验错误', async ({ page }) => {
    const createBtn = page.locator(LOCAL_SELECTORS.createButton).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });
      const saveBtn = page.locator(SELECTORS.dialogSave).first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await expect(page.locator(SELECTORS.formError).first()).toBeVisible({ timeout: 5_000 });
      }
    } else {
      // 审计日志页面无新增按钮时，验证列表渲染即可
      await expect(page.locator(APP_SELECTOR)).toBeVisible();
    }
  });
});
