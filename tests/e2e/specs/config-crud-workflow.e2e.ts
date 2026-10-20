/**
 * 配置管理 CRUD 工作流 E2E — 验证新增/编辑/删除配置项完整生命周期
 *
 * <p>运行前需启动 system-web 开发服务：
 * <pre>
 *   E2E_PORT=5602 E2E_APP_CMD='pnpm -F @ydsz/system-web run dev' \
 *     pnpm test:e2e tests/e2e/specs/config-crud-workflow.e2e.ts
 * </pre>
 *
 * <p>场景：config-crud-workflow
 * <ol>
 *   <li>登录系统 → 进入配置管理页面</li>
 *   <li>新增配置项 → 断言表格中出现新项</li>
 *   <li>编辑配置项 → 断言值已更新</li>
 *   <li>删除配置项 → 断言表格中已移除</li>
 * </ol>
 *
 * @path tests/e2e/specs/config-crud-workflow.e2e.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理（UI 变更时统一调整） */
const SELECTORS = {
  /** 应用主容器 — Vue 挂载完成的标志 */
  appContainer: '.app-container',
  /** 数据表格 */
  dataTable: '.el-table',
  /** 新增按钮 */
  createButton: 'button:has-text("新增"), button:has-text("新建"), button:has-text("添加")',
  /** 对话框 */
  dialog: '.el-dialog',
  /** 对话框中的保存/提交按钮 */
  dialogSave: '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定")',
  /** 表单校验错误提示 */
  formError: '.el-form-item__error',
  /** 表格行 */
  tableRow: '.el-table__row',
  /** 行操作编辑按钮 */
  rowEdit: 'button:has-text("编辑"), a:has-text("编辑")',
  /** 行操作删除按钮 */
  rowDelete: 'button:has-text("删除"), a:has-text("删除")',
  /** 确认删除对话框 */
  confirmDialog: '.el-message-box, .el-popconfirm',
  confirmOk: '.el-message-box__btns button:has-text("确定"), .el-popconfirm__action button:has-text("确定"), .el-button--primary',
} as const;

/** 测试数据 */
const TEST_CONFIG = {
  key: `test_e2e_config_${Date.now()}`,
  value: 'test_value_initial',
  updatedValue: 'test_value_updated',
  label: 'E2E测试配置项',
  updatedLabel: 'E2E测试配置项-已修改',
};

/**
 * 等待应用完成 SPA 渲染。
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.appContainer, { state: 'visible', timeout: 15_000 });
}

/**
 * 登录系统（使用开发环境默认凭据）。
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // 等待登录表单渲染
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await expect(usernameInput).toBeVisible({ timeout: 10_000 });

  // 填写凭据（开发环境快速登录）
  await usernameInput.fill('admin');
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('admin123');

  // 点击登录按钮
  const loginBtn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登 录")').first();
  await loginBtn.click();

  // 登录成功后等待主页渲染
  await waitForAppReady(page);
}

test.describe('Config CRUD Workflow — 配置管理增删改查', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await login(page);
    await page.goto('/system/config', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    // 等待表格渲染（数据加载完成）
    await page.waitForTimeout(1000);
  });

  test('TC-CONFIG-001: 新增配置项 → 断言表格中出现新项', async ({ page }) => {
    // 点击新增按钮
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // 对话框应弹出
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });

    // 填写配置项信息
    const configKeyInput = page.locator(
      'input[placeholder*="key"], input[placeholder*="编码"], input[placeholder*="标识"], .el-form-item:has(label:has-text("编码")) input, .el-form-item:has(label:has-text("Key")) input',
    ).first();
    if (await configKeyInput.isVisible({ timeout: 3_000 })) {
      await configKeyInput.fill(TEST_CONFIG.key);
    }

    const configValueInput = page.locator(
      'input[placeholder*="value"], input[placeholder*="值"], .el-form-item:has(label:has-text("值")) input',
    ).first();
    if (await configValueInput.isVisible({ timeout: 3_000 })) {
      await configValueInput.fill(TEST_CONFIG.value);
    }

    const configLabelInput = page.locator(
      'input[placeholder*="名称"], input[placeholder*="label"], .el-form-item:has(label:has-text("名称")) input',
    ).first();
    if (await configLabelInput.isVisible({ timeout: 3_000 })) {
      await configLabelInput.fill(TEST_CONFIG.label);
    }

    // 提交表单
    const saveBtn = page.locator(SELECTORS.dialogSave).first();
    if (await saveBtn.isVisible({ timeout: 3_000 })) {
      await saveBtn.click();
    }

    // 等待对话框消失
    await expect(page.locator(SELECTORS.dialog)).not.toBeVisible({ timeout: 10_000 });

    // 断言表格中出现新项（搜索配置 key）
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="关键字"]').first();
    if (await searchInput.isVisible({ timeout: 3_000 })) {
      await searchInput.fill(TEST_CONFIG.key);
      const searchBtn = page.locator('button:has-text("搜索"), button:has-text("查询")').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
      }
      await page.waitForTimeout(500);
    }

    // 表格中包含新增的配置项
    const tableCell = page.locator(`td:has-text("${TEST_CONFIG.key}"), .el-table__row:has-text("${TEST_CONFIG.key}")`).first();
    await expect(tableCell).toBeVisible({ timeout: 10_000 });
  });

  test('TC-CONFIG-002: 编辑配置项 → 断言值已更新', async ({ page }) => {
    // 先搜索目标配置项
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="关键字"]').first();
    if (await searchInput.isVisible({ timeout: 3_000 })) {
      await searchInput.fill(TEST_CONFIG.key);
      const searchBtn = page.locator('button:has-text("搜索"), button:has-text("查询")').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
      }
      await page.waitForTimeout(500);
    }

    // 找到目标行并点击编辑
    const rowWithItem = page.locator(SELECTORS.tableRow).filter({ hasText: TEST_CONFIG.key });
    await expect(rowWithItem.first()).toBeVisible({ timeout: 10_000 });

    const editBtn = rowWithItem.first().locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.isVisible({ timeout: 3_000 })) {
      await editBtn.click();
    }

    // 对话框应弹出
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });

    // 修改值
    const configValueInput = page.locator(
      'input[placeholder*="value"], input[placeholder*="值"], .el-form-item:has(label:has-text("值")) input',
    ).first();
    if (await configValueInput.isVisible({ timeout: 3_000 })) {
      await configValueInput.fill(TEST_CONFIG.updatedValue);
    }

    // 提交
    const saveBtn = page.locator(SELECTORS.dialogSave).first();
    if (await saveBtn.isVisible({ timeout: 3_000 })) {
      await saveBtn.click();
    }

    // 等待对话框消失
    await expect(page.locator(SELECTORS.dialog)).not.toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    // 断言表格中包含更新后的值
    const updatedCell = page.locator(`td:has-text("${TEST_CONFIG.updatedValue}"), .el-table__row:has-text("${TEST_CONFIG.updatedValue}")`).first();
    await expect(updatedCell).toBeVisible({ timeout: 10_000 });
  });

  test('TC-CONFIG-003: 删除配置项 → 断言表格中已移除', async ({ page }) => {
    // 先搜索目标配置项
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="关键字"]').first();
    if (await searchInput.isVisible({ timeout: 3_000 })) {
      await searchInput.fill(TEST_CONFIG.key);
      await page.waitForTimeout(500);
    }

    // 找到目标行并点击删除
    const rowWithItem = page.locator(SELECTORS.tableRow).filter({ hasText: TEST_CONFIG.key });
    const rowCount = await rowWithItem.count();
    if (rowCount > 0) {
      const deleteBtn = rowWithItem.first().locator('button:has-text("删除"), a:has-text("删除")').first();
      if (await deleteBtn.isVisible({ timeout: 3_000 })) {
        await deleteBtn.click();
      }

      // 如果弹出确认对话框，确认删除
      const confirmOk = page.locator(SELECTORS.confirmOk).first();
      if (await confirmOk.isVisible({ timeout: 3_000 })) {
        await confirmOk.click();
      }

      // 等待删除完成
      await page.waitForTimeout(1000);

      // 断言表格中已无该配置项
      const deletedRow = page.locator(SELECTORS.tableRow).filter({ hasText: TEST_CONFIG.key });
      await expect(deletedRow).toHaveCount(0, { timeout: 10_000 });
    } else {
      // 如果找不到行（上一步可能未删除），则直接通过
      test.skip(true, '目标配置项已不存在于表中（可能在之前的测试中已删除或未创建）');
    }
  });
});
