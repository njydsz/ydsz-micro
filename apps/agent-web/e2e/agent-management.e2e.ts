/**
 * Agent 管理页 E2E 测试（云顶编码规范 §16.10 第三阶段）。
 *
 * <p>验证「前端核心用例 1：登录 → 鉴权 → Agent 列表导航」完整旅程。
 *
 * <p><b>注意：</b>当前为 Phase 3 Playwright 骨架。激活需要：
 * <ol>
 *   <li>安装 Playwright 浏览器：{@code pnpm playwright install chromium}</li>
 *   <li>启动后端 mock / 真实环境：{@code pnpm mock} 或 target http://localhost:9000</li>
 *   <li>取消文件首行的 `test.describe.skip`</li>
 * </ol>
 *
 * @path apps/agent-web/e2e/agent-management.e2e.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { test, expect, type Page } from '@playwright/test';

// Phase 3 骨架 — 完整 E2E 未就绪前跳过；激活时移除 .skip
test.describe.skip('Agent 管理 E2E（Phase 3 骨架）', () => {
  // 选择器常量（集中管理，便于 UI 变更时批量修复）
  const SELECTORS = {
    cardGrid: '[data-testid="agent-card-grid"]',
    createButton: 'button:has-text("新建 Agent")',
    searchInput: 'input[placeholder*="搜索"]',
    viewToggle: '[data-testid="view-mode-toggle"]',
    dialog: '.el-dialog',
    dialogSave: '.el-dialog__footer button:has-text("保存")',
  } as const;

  /**
   * 预热步骤：登录 + 导航 Agent 管理页。
   * 鉴权在 Phase 3 激活时从 env 注入测试账号。
   */
  test.beforeEach(async ({ page }: { page: Page }) => {
    // TODO Phase 3: 登录流程（调用 /api/login 或 page.goto('/login') 填写表单）
    await page.goto('/agent/list');
    // 等待 Vue Router 完成 SPA 渲染，避免与 loading spinner 竞争权
    await page.waitForSelector('.app-container', { state: 'visible' });
  });

  test('P0-1a: Agent 列表页 — 应正常加载并展示标题与搜索框', async ({ page }) => {
    // SPA 渲染完成后检查
    await expect(page.locator('h1')).toContainText('Agent管理');
    await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
    await expect(page.locator(SELECTORS.viewToggle)).toBeVisible();
  });

  test('P0-1b: Agent 列表页 — 点击「新建 Agent」应弹出表单对话框', async ({ page }) => {
    await page.locator(SELECTORS.createButton).click();
    await expect(page.locator(SELECTORS.dialog)).toBeVisible();
    // 校验必填字段（agentCode/agentName）渲染
    await expect(page.locator('label:has-text("Agent编码")')).toBeVisible();
    await expect(page.locator('input[name="agentCode"]')).toBeVisible();
  });

  test('P0-1c: Agent 创建流程 — 填写表单并保存 → 列表出现新记录', async ({ page }) => {
    const code = `e2e-test-agent-${Date.now()}`;

    await page.locator(SELECTORS.createButton).click();
    await page.locator('input[name="agentCode"]').fill(code);
    await page.locator('input[name="agentName"]').fill(`E2E测试-${code}`);
    await page.locator('textarea[name="description"]').fill('Playwright E2E 骨架测试');

    // 选择 Agent 类型（下拉框）
    await page.locator('.el-select').first().click();
    await page.locator('.el-dropdown-menu__item:has-text("对话型")').click();

    // 提交
    await page.locator(SELECTORS.dialogSave).click();
    // 校验保存成功 toast/message
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 10_000 });

    // 列表展示新记录
    await expect(page.locator(`text=${code}`)).toBeVisible();
  });

  test('P0-1d: Agent 删除流程 — 二次确认后清除记录', async ({ page }) => {
    const target = page.locator('.entity-card').first();
    await target.hover();
    await target.locator('.delete-btn').click();
    // 二次确认弹窗
    await expect(page.locator('text=确认删除')).toBeVisible();
    await page.locator('.el-button--danger:has-text("删除")').click();
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('P0-1e: 视图切换 — 卡片/表格视图切换按钮状态正确', async ({ page }) => {
    // 默认卡片视图
    await expect(page.locator(SELECTORS.viewToggle)).toContainText('卡片');

    // 切到表格
    await page.locator(SELECTORS.viewToggle).click();
    await expect(page.locator('.vxe-table--main-wrapper')).toBeVisible({ timeout: 5_000 });

    // 切回卡片
    await page.locator(SELECTORS.viewToggle).click();
    await expect(page.locator(SELECTORS.cardGrid)).toBeVisible();
  });
});

/**
 * Phase 3 第二个核心用例：消息通知（P0-2 系列）。
 * 激活时移出 describe.skip 并扩展。
 */
test.describe.skip('通知中心 E2E（Phase 3 骨架）', () => {
  test('P0-2a: 消息通知 — 未读消息数角标正确显示', async ({ page }) => {
    await page.goto('/');
    const badge = page.locator('.notification-badge');
    await expect(badge).toBeVisible();
    const count = parseInt((await badge.textContent()) || '0');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
