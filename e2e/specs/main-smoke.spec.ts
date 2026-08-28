/**
 * 主应用冒烟用例 — 启动 / 路由可达 / a11y 基线
 *
 * @path e2e/specs/main-smoke.spec.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('主应用冒烟', () => {
  test('根路径可加载并渲染应用外壳', async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on('pageerror', (error) => fatalErrors.push(String(error)));

    await page.goto('/');
    // 主应用挂载点必须渲染（无论重定向到登录页还是 dashboard）
    await expect(page.locator('#app')).toBeAttached();
    // 未登录场景应最终落在认证页或携带布局的页面，均属冒烟通过
    await expect(page).toHaveURL(/.+/);
    await page.waitForLoadState('networkidle');

    // micro-kernel ESM 直引模式下致命脚本错误视为冒烟失败
    const realFatal = fatalErrors.filter(
      (msg) => !msg.includes('ResizeObserver') && !msg.includes('net::'),
    );
    expect(realFatal, `页面存在未捕获异常：${realFatal.join(' | ')}`).toHaveLength(0);
  });

  test('登录页通过 a11y 严重度基线（critical=0）', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    if (critical.length > 0) {
      const summary = critical
        .map((v) => `${v.id}(${v.nodes.length} 处): ${v.help}`)
        .join('; ');
      test.info().annotations.push({
        type: 'a11y-critical',
        description: summary,
      });
    }
    expect(critical, '登录页存在 WCAG A 级严重问题').toHaveLength(0);
  });
});
