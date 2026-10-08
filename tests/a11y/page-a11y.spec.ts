/**
 * 页面级无障碍扫描 — 云顶编码规范 §16.10 第四阶段。
 *
 * <p>在组件级烟雾测试（{@link smoke.spec.ts}）之上，模拟核心业务页面结构
 * （登录页、Dashboard、列表页），验证页面级 landmarks、标题层级、导航结构
 * 是否符合 WCAG 2.1 AA。
 *
 * <p>与组件级测试共享同一 fixture 服务器（独立子页面），确保无后端鉴权依赖，
 * PR 阶段即可快速卡控。
 *
 * @path tests/a11y/page-a11y.spec.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  configureAxeBuilder,
  filterBlockingViolations,
  formatViolations,
} from './axe.config';

/**
 * 核心页面清单 — 覆盖主要业务入口。
 *
 * <p>每个页面由独立 fixture 子页面模拟其 DOM 结构。
 * 页面路径命名与真实路由一致，便于维护对照。
 */
const CORE_PAGES = [
  {
    name: '登录页',
    path: '/login',
    fixture: 'login.html',
    description: '平台登录入口，验证 landmarks、表单控件标签与错误提示',
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    fixture: 'dashboard.html',
    description: '主控台首页，验证标题层级、导航与区域 landmarks',
  },
  {
    name: '列表页',
    path: '/list',
    fixture: 'list.html',
    description: '数据表格列表页，验证表格语义、筛选区与分页可访问性',
  },
] as const;

test.describe('页面级无障碍冒烟（WCAG 2.1 AA）', () => {
  for (const pageDef of CORE_PAGES) {
    test(`P1-a11y: ${pageDef.name} — 无 critical / serious 违规`, async ({ page }) => {
      // 导航至对应 fixture 子页面
      await page.goto(pageDef.fixture, { waitUntil: 'domcontentloaded' });
      // 等待 fixture 渲染完成标记
      await page.waitForSelector('[data-a11y-fixture="ready"]', { timeout: 15_000 });

      const results = await configureAxeBuilder(
        new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']),
      ).analyze();

      const blocking = filterBlockingViolations(results.violations);
      expect(
        blocking,
        `[${pageDef.name}] 发现 ${blocking.length} 个阻断级违规:\n${formatViolations(blocking)}`,
      ).toHaveLength(0);
    });
  }
});
