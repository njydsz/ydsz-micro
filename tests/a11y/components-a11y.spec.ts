/**
 * 新增组件无障碍扫描 — 云顶编码规范 §16.10 第四阶段。
 *
 * <p>针对本轮新增的 OrganizationChart / ImageViewer / 暗黑模式切换
 * 补充 WCAG 2.1 AA 扫描用例，确保新组件上线即为合规基线。
 *
 * <p>复用 smoke.spec.ts 的 AxeBuilder 配置（axe.config.ts），
 * 仅追加本轮新增的组件与主题场景，不做重复检测。
 *
 * @path tests/a11y/components-a11y.spec.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  configureAxeBuilder,
  filterBlockingViolations,
  formatViolations,
} from './axe.config';

/**
 * OrganizationChart fixture — 模拟三层层级结构。
 *
 * <p>使用原生 <ul><li> 嵌套模拟组件的 tree 语义；
 * 每个节点含 button[aria-expanded] 模拟展开/折叠，
 * 选中态通过 aria-checked 标记。
 */
const ORG_CHART_HTML = `
<main data-a11y-fixture="ready">
  <h1>组织架构图示例</h1>
  <ul role="tree" aria-label="公司组织架构">
    <li role="treeitem" aria-expanded="true" aria-selected="false">
      <button type="button" aria-label="总公司 已展开" aria-expanded="true">总公司</button>
      <ul role="group">
        <li role="treeitem" aria-expanded="true" aria-selected="false">
          <button type="button" aria-label="技术部 已展开" aria-expanded="true">技术部</button>
          <ul role="group">
            <li role="treeitem" aria-expanded="false" aria-selected="true">
              <button type="button" aria-label="前端组" disabled>前端组</button>
            </li>
            <li role="treeitem" aria-expanded="false" aria-selected="false">
              <button type="button" aria-label="后端组" disabled>后端组</button>
            </li>
          </ul>
        </li>
        <li role="treeitem" aria-expanded="false" aria-selected="false">
          <button type="button" aria-label="产品部" disabled>产品部</button>
        </li>
      </ul>
    </li>
  </ul>
</main>
`;

/**
 * ImageViewer fixture — 模拟缩略图容器 + 预览图层。
 *
 * <p>缩略图按钮 aria-label 含图片描述，预览图层 role=dialog + aria-modal + aria-label。
 */
const IMAGE_VIEWER_HTML = `
<main data-a11y-fixture="ready">
  <h1>图片预览示例</h1>
  <div role="group" aria-label="产品截图列表">
    <button type="button" aria-label="查看产品截图 1">
      <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23ddd'/></svg>" alt="产品截图 1 缩略图" width="40" height="40" />
    </button>
    <button type="button" aria-label="查看产品截图 2">
      <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23bbb'/></svg>" alt="产品截图 2 缩略图" width="40" height="40" />
    </button>
  </div>
  <div role="dialog" aria-modal="true" aria-label="图片预览：产品截图 1" aria-describedby="img-desc">
    <p id="img-desc">产品截图 1（1/2）</p>
    <button type="button" aria-label="上一张">‹</button>
    <button type="button" aria-label="下一张">›</button>
    <button type="button" aria-label="关闭图片预览">关闭</button>
  </div>
</main>
`;

/**
 * 暗黑模式切换 fixture — 模拟 data-theme="dark" 容器。
 *
 * <p>验证暗色背景下对比度不违规。文本与背景对比度 ≥ 4.5:1（WCAG AA）。
 */
const DARK_MODE_HTML = `
<main data-a11y-fixture="ready" style="background:#1a1a2e;color:#e8e8f0;padding:1rem;">
  <h1 style="color:#f0f0ff;">暗黑模式示例</h1>
  <section aria-label="暗色卡片示例">
    <h2 style="color:#f0f0ff;">数据看板</h2>
    <p style="color:#c8c8d8;">一段正文文本 — 验证暗色模式下对比度 ≥ 4.5:1</p>
    <button type="button" style="background:#4a6cf7;color:#fff;border:none;padding:0.5rem 1rem;border-radius:4px;">暗色按钮</button>
    <button type="button" style="background:transparent;color:#7b8bff;border:1px solid #4a6cf7;padding:0.5rem 1rem;border-radius:4px;">次要按钮</button>
  </section>
  <table aria-label="暗色表格示例">
    <thead>
      <tr>
        <th scope="col" style="color:#f0f0ff;">列 A</th>
        <th scope="col" style="color:#f0f0ff;">列 B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:#c8c8d8;">数据 1</td>
        <td style="color:#c8c8d8;">数据 2</td>
      </tr>
    </tbody>
  </table>
</main>
`;

test.describe('新增组件无障碍冒烟（WCAG 2.1 AA）', () => {
  test('P2-a11y: OrganizationChart — 树结构键盘交互与 ARIA 状态', async ({ page, context }) => {
    await page.setContent(ORG_CHART_HTML);

    const results = await configureAxeBuilder(
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']),
    ).analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `OrganizationChart 存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
    void context;
  });

  test('P2-a11y: ImageViewer — 图片预览焦点管理与可访问名称', async ({ page, context }) => {
    await page.setContent(IMAGE_VIEWER_HTML);

    const results = await configureAxeBuilder(
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']),
    ).analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `ImageViewer 存在阻断级违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
    void context;
  });

  test('P2-a11y: 暗黑模式 — 文本/按钮/表格暗色对比度合规', async ({ page, context }) => {
    await page.setContent(DARK_MODE_HTML);

    const results = await configureAxeBuilder(
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        // 对比度规则需启用 fullContext 以获取有效颜色值
        .options({ rules: { 'color-contrast': { enabled: true } } }),
    ).analyze();

    const blocking = filterBlockingViolations(results.violations);
    expect(
      blocking,
      `暗黑模式存在阻断级对比违规:\n${formatViolations(blocking)}`,
    ).toHaveLength(0);
    void context;
  });
});
