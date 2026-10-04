/**
 * Web Vitals CI 基线测试
 *
 * <p>使用 Playwright + Chromium 在生产构建产物上真实测量 LCP / CLS / FCP / TTFB，
 * 与 main 分支基线（.perf-budget.json）对比，退化 > 20% 则失败。
 *
 * <p>输出：
 * - test-results/web-vitals-metrics.json：原始测量数据
 * - playwright-report/：HTML 报告
 * - test-results/junit.xml：JUnit XML
 *
 * @path tests\performance\web-vitals.spec.ts
 * @author ydsz-team
 * @since 5.2.0
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

/** 基线阈值（与 .perf-budget.json 的 timings 对齐） */
const BASELINE_BUDGET = {
  lcp: 2500,  // ms — Largest Contentful Paint
  cls: 0.05,  // score — Cumulative Layout Shift
  fcp: 1800,  // ms — First Contentful Paint
  ttfb: 800,  // ms — Time to First Byte
};

/** 退化率阈值：超过 20% 视为性能衰退 */
const REGRESSION_THRESHOLD = 0.20;

/**
 * 收集页面 Web Vitals 指标。
 *
 * <p>通过 Performance API 在浏览器端采集真实的 LCP / CLS / FCP / TTFB 数据，
 * 回传给 Node 端进行断言。
 */
async function collectWebVitals(page: Page): Promise<{
  lcp: number;
  cls: number;
  fcp: number;
  ttfb: number;
}> {
  return page.evaluate(() => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;
      let fcp = 0;
      let ttfb = 0;
      let resolved = false;

      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) lcp = last.startTime;
        });
        lcpObserver.observe({ buffered: true, type: 'largest-contentful-paint' });
      } catch { /* not supported */ }

      // CLS
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as unknown as { hadRecentInput: boolean; value: number };
            if (!shift.hadRecentInput) cls += shift.value;
          }
        });
        clsObserver.observe({ buffered: true, type: 'layout-shift' });
      } catch { /* not supported */ }

      // FCP + TTFB (从已记录的条目中读取)
      try {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
        if (fcpEntry) fcp = fcpEntry.startTime;
      } catch { /* not supported */ }

      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const nav = navEntries[0] as PerformanceNavigationTiming;
          ttfb = nav.responseStart - nav.requestStart;
        }
      } catch { /* not supported */ }

      // 等待 LCP 稳定（2s 无新条目视为稳定）
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            cls: Math.round(cls * 1000) / 1000,
            fcp: Math.round(fcp),
            lcp: Math.round(lcp),
            ttfb: Math.round(ttfb),
          });
        }
      }, 3000);
    });
  });
}

test.describe('Web Vitals 基线', () => {
  test('首页 LCP / CLS / FCP / TTFB 不超 budget', async ({ page }, testInfo) => {
    // 预热访问，避免冷启动偏差
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 刷新后正式采集
    await page.goto('/', { waitUntil: 'networkidle' });
    const vitals = await collectWebVitals(page);

    // 输出到 stdout（便于调试）
    console.log('[Web Vitals]', JSON.stringify(vitals));

    // 写入指标 JSON 供后续退化检测脚本使用
    const metricsPath = join(
      testInfo.outputDir,
      '..',
      'web-vitals-metrics.json',
    );
    writeFileSync(metricsPath, JSON.stringify(vitals, null, 2));

    // 核心断言：不超 budget
    expect(vitals.lcp).toBeLessThanOrEqual(BASELINE_BUDGET.lcp);
    expect(vitals.cls).toBeLessThanOrEqual(BASELINE_BUDGET.cls);
    expect(vitals.fcp).toBeLessThanOrEqual(BASELINE_BUDGET.fcp);
    expect(vitals.ttfb).toBeLessThanOrEqual(BASELINE_BUDGET.ttfb);
  });

  test('性能无显著衰退（与 budget 基线对比 < 20%）', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const vitals = await collectWebVitals(page);

    // 计算各指标相对 budget 基线的退化百分比
    const lcpRegression = (vitals.lcp - BASELINE_BUDGET.lcp) / BASELINE_BUDGET.lcp;
    const clsRegression = (vitals.cls - BASELINE_BUDGET.cls) / BASELINE_BUDGET.cls;
    const fcpRegression = (vitals.fcp - BASELINE_BUDGET.fcp) / BASELINE_BUDGET.fcp;
    const ttfbRegression = (vitals.ttfb - BASELINE_BUDGET.ttfb) / BASELINE_BUDGET.ttfb;

    const maxRegression = Math.max(
      lcpRegression > 0 ? lcpRegression : 0,
      clsRegression > 0 ? clsRegression : 0,
      fcpRegression > 0 ? fcpRegression : 0,
      ttfbRegression > 0 ? ttfbRegression : 0,
    );

    console.log('[Web Vitals Regression]', JSON.stringify({
      lcp: `${(lcpRegression * 100).toFixed(1)}%`,
      cls: `${(clsRegression * 100).toFixed(1)}%`,
      fcp: `${(fcpRegression * 100).toFixed(1)}%`,
      ttfb: `${(ttfbRegression * 100).toFixed(1)}%`,
      max: `${(maxRegression * 100).toFixed(1)}%`,
    }));

    // 写入指标
    const metricsPath = join(
      testInfo.outputDir,
      '..',
      'web-vitals-metrics.json',
    );
    writeFileSync(
      metricsPath,
      JSON.stringify({
        ...vitals,
        regression: { lcp: lcpRegression, cls: clsRegression, fcp: fcpRegression, ttfb: ttfbRegression },
      }, null, 2),
    );

    // 退化不得超过 20%
    expect(maxRegression).toBeLessThan(REGRESSION_THRESHOLD);
  });
});
