/**
 * 真实路由无障碍扫描 — 针对已构建子应用的静态产物。
 *
 * @remarks
 * 与 fixture 模拟扫描（page-a11y.spec.ts）互补：本 spec 直接服务
 * `apps/{app}/dist` 的真实构建产物，扫描其真实 DOM（含 Vue 组件渲染结果），
 * 避免「fixture 通过但真实页面不通过」的假阳性。
 *
 * <p>前置条件：`pnpm build` 已产出 dist；若产物缺失则跳过（不阻断 CI），
 * 由独立的 build 门禁保证产物存在。
 *
 * <p>仅扫描各子应用的**根路由**（无鉴权、无需后端），验证：
 * <ul>
 *   <li>页面 landmarks（banner / main / contentinfo）齐全</li>
 *   <li>标题层级与 aria 属性无 critical / serious 违规</li>
 * </ul>
 *
 * @path tests/a11y/real-routes.spec.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { configureAxeBuilder, filterBlockingViolations, formatViolations } from './axe.config';

/** 待扫描的子应用（与其 dist 目录对应） */
const TARGET_APPS = [
  'agent-web',
  'cronjob-web',
  'generator-web',
  'literule-web',
  'message-web',
  'nextwiki-web',
  'system-web',
  'userinfo-web',
  'workflow-web',
] as const;

/** 仓库根目录 */
const ROOT = resolve(__dirname, '../..');

test.describe('真实构建产物无障碍扫描（WCAG 2.1 AA）', () => {
  for (const app of TARGET_APPS) {
    test(`P2-a11y: ${app} 根路由无 critical / serious 违规`, async ({ page }) => {
      const dist = resolve(ROOT, 'apps', app, 'dist', 'index.html');

      // 产物缺失时跳过：由构建门禁保证，不在此处阻断
      test.skip(!existsSync(dist), `${app} dist 未构建`);

      await page.goto(`file://${dist.replace(/\\/g, '/')}`, {
        waitUntil: 'domcontentloaded',
      });

      const results = await configureAxeBuilder(
        new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']),
      ).analyze();

      const blocking = filterBlockingViolations(results.violations);
      expect(
        blocking,
        `[${app}] 发现 ${blocking.length} 个阻断级违规:\n${formatViolations(blocking)}`,
      ).toHaveLength(0);
    });
  }
});
