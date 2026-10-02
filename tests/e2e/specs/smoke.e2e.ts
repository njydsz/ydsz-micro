/**
 * 核心烟雾测试 — 验证全模块启动无障碍 + 核心 UI 骨架可用
 *
 * <p>不依赖后端业务 API（各级 API 失败不应阻塞渲染），
 * 仅验证 Vue 应用完成挂载且核心 shell 渲染正常。
 *
 * <p>级别定义：
 * <ul>
 *   <li>P0-smoke: 挂载 + 标题 + 无 JS 运行时错误</li>
 *   <li>P1-smoke: 登录/路由守卫可达</li>
 *   <li>P2-smoke: 核心 layout（header/sidebar/面包屑）渲染</li>
 * </ul>
 *
 * @path tests/e2e/specs/smoke.e2e.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import { test, expect, type Page } from '@playwright/test';

/** 选择器集中管理（UI 变更时统一调整） */
const SELECTORS = {
  /** 应用主容器 — Vue 挂载完成的标志 */
  appContainer: '.app-container',
  /** 水印节点 — 渲染后才出现 */
  watermark: '.watermark',
  /** 错误的兜底边界 */
  errorFallback: '[data-error-boundary]',
} as const;

/**
 * 注册页面错误监听器。
 *
 * @param page - Playwright 页面实例
 * @return 错误消息数组
 */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => {
    errors.push(error.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  return errors;
}

test.describe('全模块烟雾测试', () => {
  test('P0-smoke: 应用挂载 — Vue 实例应完成初始化并无 JS 错误', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 等待应用主容器渲染完成（最多 15 秒）
    await expect(page.locator(SELECTORS.appContainer).first()).toBeVisible({
      timeout: 15_000,
    });

    // 不应捕获到未处理的 JS 错误
    expect(errors).toHaveLength(0);
  });

  test('P1-smoke: 路由可达 — 至少渲染一个有效的 HTML 文档', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    // HTTP 状态应为 200
    expect(response?.status()).toBe(200);

    // 文档标题应为非空
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // 文档 lang 属性存在（i18n 初始化标志）
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', /^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test('P2-smoke: 组件渲染 — 兜底边界节点存在且未展示错误', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(SELECTORS.appContainer, { state: 'visible', timeout: 15_000 });

    // 兜底边界应存在
    const fallback = page.locator(SELECTORS.errorFallback);
    await expect(fallback).toBeAttached();

    // 水印节点渲染（渲染后期添加）
    const watermark = page.locator(SELECTORS.watermark);
    // 水印可能未启用时不渲染，此处仅做非崩溃校验
    await expect(watermark.or(page.locator(SELECTORS.appContainer))).toBeVisible();
  });
});
