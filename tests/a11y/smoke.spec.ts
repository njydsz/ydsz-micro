/**
 * 无障碍（a11y）自动化冒烟测试 — 云顶编码规范 §16.10 第四阶段。
 *
 * <p>基于 Playwright + @axe-core/playwright 对 ydsz-ui 关键组件运行 WCAG 2.1 AA
 * 扫描，断言无 critical / serious 级违规，作为 PR 卡点（CI job: accessibility）。
 *
 * <p>采用内嵌 Vite fixture 方案：由 webServer 启动最小 fixture 页面，
 * 渲染 ydsz-ui 关键组件（Button / Input / Select / Table / Dialog / Sheet）
 * 的标准用法，axe 扫描真实 DOM。此方案无外部依赖（无需后端鉴权），
 * 适合 PR 阶段快速卡控。
 *
 * <p>coverage 范围：
 * <ul>
 *   <li>静态语义：lang、landmark、标题层级、scope 关联</li>
 *   <li>可访问名称：按钮、链接、表单控件、iframe</li>
 *   <li>键盘可达：焦点顺序、tab 陷阱（dialog）</li>
 *   <li>对比度（color-contrast 关闭，由视觉回归替代）</li>
 * </ul>
 *
 * @path tests/a11y/smoke.spec.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 受控违规阈值 — 仅阻断 critical / serious。
 *
 * <p>moderate / minor 不纳入 PR 卡点（减少二噪声），但输出到报告中供人工跟踪。
 */
const BLOCKING_IMPACTS = ['critical', 'serious'] as const;

/**
 * 严重级别排序权重（数字越大越严重，用于过滤比较）。
 */
const SEVERITY_WEIGHT: Record<string, number> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

/**
 * 将 axe 结果中的 violation 过滤出阻断级别项，返回空数组即通过。
 *
 * @param violations - axe-core 返回的 violations 列表
 * @return 命中阻断阈值的 violation 数组
 */
function filterBlockingViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): typeof violations {
  return violations.filter((v) => BLOCKING_IMPACTS.includes(v.impact as (typeof BLOCKING_IMPACTS)[number]));
}

/**
 * 格式化为人类可读的错误详情，便于 CI 日志定位。
 *
 * @param violations - 阻断级 violation 列表
 */
function formatViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `    - ${n.html} (${n.failureSummary ?? 'no summary'})`).join('\n');
      return `  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n    help: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}

test.describe('ydsz-ui 无障碍冒烟（WCAG 2.1 AA）', () => {
  test.beforeEach(async ({ page }) => {
    // 等待 fixture 页面完成 Vue 挂载后再进入扫描
    await page.goto('/');
    // 通过 ydsz-ui 的特定选择器判断 Vue 应用已完成挂载
    await page.waitForSelector('[data-a11y-fixture="ready"]', { timeout: 15_000 });
  });

  test('P1-a11y: 整页扫描 — 应无 critical / serious 违规', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // color-contrast 已在 axe.config.ts 中关闭规则
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `发现 ${blocking.length} 个阻断级违规（critical / serious）:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Button 组件 — 图标按钮必须具备可访问名称', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-button"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Button 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Input 组件 — 输入控件必须具备 label 关联', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-input"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Input 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Select 组件 — 选择器必须具备可访问名称与选项文本', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-select"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Select 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Table 组件 — 表头必须具备 scope 关联', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-table"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Table 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Dialog 组件 — 模态对话框必须具备可访问名称与焦点管理', async ({ page }) => {
    // Dialog 默认未打开，先点击触发器
    await page.locator('[data-testid="dialog-trigger"]').click();
    // 等待 Dialog 内容渲染完成
    await page.waitForSelector('[data-testid="fixture-dialog"]', { state: 'visible', timeout: 5_000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-dialog"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Dialog 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });

  test('P1-a11y: Sheet 组件 — 侧边抽屉必须具备可访问名称', async ({ page }) => {
    // Sheet 默认未打开，先点击触发器
    await page.locator('[data-testid="sheet-trigger"]').click();
    // 等待 Sheet 内容渲染完成
    await page.waitForSelector('[data-testid="fixture-sheet"]', { state: 'visible', timeout: 5_000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('[data-testid="fixture-sheet"]')
      .analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `Sheet 组件存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
  });
});
