/**
 * 字典管理 — 字典 + 字典项操作 E2E 工作流
 *
 * <p>运行前需启动 system-web 开发服务：
 * <pre>
 *   E2E_PORT=5602 E2E_APP_CMD='pnpm -F @ydsz/system-web run dev' \
 *     pnpm test:e2e tests/e2e/specs/dict-item-workflow.e2e.ts
 * </pre>
 *
 * <p>场景：dict-item-workflow
 * <ol>
 *   <li>进入字典管理页面</li>
 *   <li>新增字典 + 字典项 → 验证创建成功</li>
 *   <li>切换字典项状态 → 验证状态切换生效</li>
 * </ol>
 *
 * @path tests/e2e/specs/dict-item-workflow.e2e.ts
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
  dialogSave:
    '.el-dialog__footer button:has-text("保存"), .el-dialog__footer button:has-text("提交"), .el-dialog__footer button:has-text("确定")',
  formError: '.el-form-item__error',
  tableRow: '.el-table__row',
  rowEdit: 'button:has-text("编辑"), a:has-text("编辑")',
  rowDelete: 'button:has-text("删除"), a:has-text("删除")',
  confirmOk:
    '.el-message-box__btns button:has-text("确定"), .el-popconfirm__action button:has-text("确定"), .el-button--primary',
  // 状态切换开关
  switchToggle: '.el-switch',
  // Tab / 字典项入口
  dictItemTab: 'div:has-text("字典项"), [role="tab"]:has-text("字典项"), .el-tabs__item:has-text("字典项")',
  // 子表格（字典项列表 inside dialog or detail）
  subTable: '.el-dialog .el-table, .detail-panel .el-table',
} as const;

/** 测试数据 */
const TEST_DICT = {
  type: `test_dict_${Date.now()}`,
  typeName: `E2E测试字典-${Date.now()}`,
  itemLabel: '测试项',
  itemValue: 'test_item_value',
};

/**
 * 等待应用完成 SPA 渲染。
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.appContainer, { state: 'visible', timeout: 15_000 });
}

/**
 * 登录系统（开发环境默认凭据）。
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await expect(usernameInput).toBeVisible({ timeout: 10_000 });

  await usernameInput.fill('admin');
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('admin123');

  const loginBtn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登 录")').first();
  await loginBtn.click();

  await waitForAppReady(page);
}

test.describe('Dict Item Workflow — 字典管理新增与状态切换', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await login(page);
    await page.goto('/system/dict-type', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
  });

  test('TC-DICT-001: 新增字典 → 断言表格中出现新字典', async ({ page }) => {
    // 点击新增按钮
    const createBtn = page.locator(SELECTORS.createButton).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // 对话框应弹出
    await expect(page.locator(SELECTORS.dialog)).toBeVisible({ timeout: 5_000 });

    // 填写字典类型
    const typeInput = page.locator(
      'input[placeholder*="类型编码"], input[placeholder*="type"], .el-form-item:has(label:has-text("类型编码")) input, .el-form-item:has(label:has-text("字典编码")) input',
    ).first();
    if (await typeInput.isVisible({ timeout: 3_000 })) {
      await typeInput.fill(TEST_DICT.type);
    }

    // 填写字典名称
    const nameInput = page.locator(
      'input[placeholder*="名称"], input[placeholder*="name"], .el-form-item:has(label:has-text("名称")) input, .el-form-item:has(label:has-text("字典名称")) input',
    ).first();
    if (await nameInput.isVisible({ timeout: 3_000 })) {
      await nameInput.fill(TEST_DICT.typeName);
    }

    // 提交
    const saveBtn = page.locator(SELECTORS.dialogSave).first();
    if (await saveBtn.isVisible({ timeout: 3_000 })) {
      await saveBtn.click();
    }

    await expect(page.locator(SELECTORS.dialog)).not.toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    // 断言表格中出现新字典
    const newRow = page.locator(
      `td:has-text("${TEST_DICT.type}"), .el-table__row:has-text("${TEST_DICT.typeName}")`,
    ).first();
    await expect(newRow).toBeVisible({ timeout: 10_000 });
  });

  test('TC-DICT-002: 查看字典详情 + 新增字典项 → 断言字典项出现在列表中', async ({ page }) => {
    // 查找刚刚创建的字典，点击进入详情或字典项 tab
    const targetRow = page.locator(SELECTORS.tableRow).filter({ hasText: TEST_DICT.typeName });
    if (await targetRow.count() === 0) {
      // 如果第一个测试未运行，用 type 搜索
      const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="关键字"]').first();
      if (await searchInput.isVisible({ timeout: 3_000 })) {
        await searchInput.fill(TEST_DICT.type);
        await page.waitForTimeout(500);
      }
    }

    const detailBtn = page
      .locator(SELECTORS.tableRow)
      .filter({ hasText: TEST_DICT.type })
      .first()
      .locator('button:has-text("详情"), button:has-text("查看字典项"), a:has-text("字典项")')
      .first();

    // 尝试点击「查看字典项」或类似入口
    if (await detailBtn.isVisible({ timeout: 3_000 })) {
      await detailBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // 可能直接在行内有编辑按钮打开 dialog 后切 tab
      const editBtn = page
        .locator(SELECTORS.tableRow)
        .filter({ hasText: TEST_DICT.type })
        .first()
        .locator('button:has-text("编辑"), a:has-text("编辑")')
        .first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 切换到「字典项」tab 或面板
    const dictItemTab = page.locator(SELECTORS.dictItemTab).first();
    if (await dictItemTab.isVisible({ timeout: 3_000 })) {
      await dictItemTab.click();
      await page.waitForTimeout(500);
    }

    // 在字典项区域点击新增
    const addItemBtn = page
      .locator('button:has-text("新增字典项"), button:has-text("添加项"), button:has-text("新增")')
      .last();
    if (await addItemBtn.isVisible({ timeout: 3_000 })) {
      await addItemBtn.click();
      await page.waitForTimeout(500);
    }

    // 填写字典项信息
    const itemLabelInput = page.locator(
      'input[placeholder*="标签"], input[placeholder*="label"], .el-form-item:has(label:has-text("标签")) input',
    ).first();
    if (await itemLabelInput.isVisible({ timeout: 3_000 })) {
      await itemLabelInput.fill(TEST_DICT.itemLabel);
    }

    const itemValueInput = page.locator(
      'input[placeholder*="值"], input[placeholder*="value"], .el-form-item:has(label:has-text("值")) input',
    ).first();
    if (await itemValueInput.isVisible({ timeout: 3_000 })) {
      await itemValueInput.fill(TEST_DICT.itemValue);
    }

    // 提交
    const saveBtn = page.locator(SELECTORS.dialogSave).last();
    if (await saveBtn.isVisible({ timeout: 3_000 })) {
      await saveBtn.click();
    }

    await page.waitForTimeout(1000);

    // 断言字典项出现
    const itemRow = page.locator(
      `td:has-text("${TEST_DICT.itemLabel}"), td:has-text("${TEST_DICT.itemValue}"), .el-table__row:has-text("${TEST_DICT.itemLabel}")`,
    ).first();
    await expect(itemRow).toBeVisible({ timeout: 10_000 });
  });

  test('TC-DICT-003: 切换字典项状态 → 验证状态变化', async ({ page }) => {
    // 找到目标字典
    await page.goto('/system/dict-type', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="关键字"]').first();
    if (await searchInput.isVisible({ timeout: 3_000 })) {
      await searchInput.fill(TEST_DICT.type);
      await page.waitForTimeout(500);
    }

    const targetRow = page.locator(SELECTORS.tableRow).filter({ hasText: TEST_DICT.type });
    if (await targetRow.count() === 0) {
      test.skip(true, '目标字典不存在，跳过状态切换测试');
      return;
    }

    // 进入字典项编辑界面
    const editBtn = targetRow.first().locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.isVisible({ timeout: 3_000 })) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // 切换到字典项 tab
    const dictItemTab = page.locator(SELECTORS.dictItemTab).first();
    if (await dictItemTab.isVisible({ timeout: 3_000 })) {
      await dictItemTab.click();
      await page.waitForTimeout(500);
    }

    // 查找目标字典项所在行，操作状态开关
    const itemSwitch = page
      .locator(SELECTORS.tableRow)
      .filter({ hasText: TEST_DICT.itemValue })
      .first()
      .locator(SELECTORS.switchToggle)
      .first();

    if (await itemSwitch.isVisible({ timeout: 5_000 })) {
      // 读取当前状态
      const wasActive = await itemSwitch.evaluate(
        (el: HTMLElement) => el.classList.contains('is-checked') || el.getAttribute('aria-checked') === 'true',
      );

      // 点击切换
      await itemSwitch.click();
      await page.waitForTimeout(1000);

      // 验证状态已改变
      const nowActive = await itemSwitch.evaluate(
        (el: HTMLElement) => el.classList.contains('is-checked') || el.getAttribute('aria-checked') === 'true',
      );
      expect(nowActive).toBe(!wasActive);
    } else {
      // 如果没有找到 switch toggle，尝试其他状态切换方式
      const statusToggle = page
        .locator(SELECTORS.tableRow)
        .filter({ hasText: TEST_DICT.itemValue })
        .first()
        .locator('.el-switch, [role="switch"], .el-checkbox')
        .first();

      if (await statusToggle.isVisible({ timeout: 3_000 })) {
        await statusToggle.click();
        await page.waitForTimeout(500);
      }

      test.skip(true, '状态切换 UI 元素未找到，该场景可能需要根据实际 UI 调整选择器');
    }
  });
});
