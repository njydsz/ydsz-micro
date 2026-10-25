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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { test, expect, type Page, type TestInfo } from '@playwright/test';

/** 本用例实际采集的指标；budget 文件里多出来的（fid/inp）不参与断言 */
const MEASURED_METRICS = ['lcp', 'cls', 'fcp', 'ttfb'] as const;

/** 退化率阈值：超过 20% 视为性能衰退（与 CI 的 --threshold 0.20 同口径） */
const REGRESSION_THRESHOLD = 0.20;

/** 仓库根：Playwright 给的 configFile 是绝对路径，据此定位，避免依赖进程 cwd */
function repoRootOf(testInfo: TestInfo): string {
  return dirname(testInfo.config.configFile ?? process.cwd());
}

/**
 * 基线阈值：读 main/.perf-budget.json 的 timings。
 *
 * <p>此前这里抄了一份硬编码常量，而 CI 的 bash/check-performance-regression.py 读的是
 * 同一个 budget 文件 —— 两份事实源，改一处漏一处：main 收紧预算后，测试仍按旧常量放行。
 */
function loadBudget(testInfo: TestInfo): Record<string, number> {
  const file = join(repoRootOf(testInfo), 'main', '.perf-budget.json');
  const config = JSON.parse(readFileSync(file, 'utf8')) as {
    budgets?: { timings?: { metric: string; budget: number }[] }[];
  };
  const timings: Record<string, number> = {};
  for (const item of config.budgets?.[0]?.timings ?? []) {
    timings[item.metric] = item.budget;
  }
  const missing = MEASURED_METRICS.filter((metric) => !(metric in timings));
  if (missing.length > 0) {
    throw new Error(`${file} 缺少指标阈值：${missing.join(', ')} —— 拒绝在"无阈值"下跑性能门禁`);
  }
  return timings;
}

/**
 * 写出指标 JSON 到 CI 约定的固定路径。
 *
 * <p>原先用 join(testInfo.outputDir, '..', ...)，落点取决于 Playwright 给用例建的输出目录
 * 层级；层级一变，performance.yml 里 --current 指向的文件就成了上一轮残留或根本不存在，
 * 门禁读不到本次数据却照样"绿"。
 */
function writeMetrics(testInfo: TestInfo, payload: Record<string, unknown>): void {
  const target = join(repoRootOf(testInfo), 'test-results', 'web-vitals-metrics.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(payload, null, 2));
}

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
    const budget = loadBudget(testInfo);

    // 预热访问，避免冷启动偏差
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 刷新后正式采集
    await page.goto('/', { waitUntil: 'networkidle' });
    const vitals = await collectWebVitals(page);

    // 输出到 stdout（便于调试）
    console.log('[Web Vitals]', JSON.stringify(vitals));

    // 写入指标 JSON 供后续退化检测脚本使用
    writeMetrics(testInfo, vitals);

    // 核心断言：不超 budget
    expect(vitals.lcp, `LCP ${vitals.lcp}ms 超预算 ${budget.lcp}ms`).toBeLessThanOrEqual(budget.lcp);
    expect(vitals.cls, `CLS ${vitals.cls} 超预算 ${budget.cls}`).toBeLessThanOrEqual(budget.cls);
    expect(vitals.fcp, `FCP ${vitals.fcp}ms 超预算 ${budget.fcp}ms`).toBeLessThanOrEqual(budget.fcp);
    expect(vitals.ttfb, `TTFB ${vitals.ttfb}ms 超预算 ${budget.ttfb}ms`).toBeLessThanOrEqual(budget.ttfb);
  });

  test('性能无显著衰退（与 budget 基线对比 < 20%）', async ({ page }, testInfo) => {
    const budget = loadBudget(testInfo);
    await page.goto('/', { waitUntil: 'networkidle' });
    const vitals = await collectWebVitals(page);

    // 计算各指标相对 budget 基线的退化百分比
    const lcpRegression = (vitals.lcp - budget.lcp) / budget.lcp;
    const clsRegression = (vitals.cls - budget.cls) / budget.cls;
    const fcpRegression = (vitals.fcp - budget.fcp) / budget.fcp;
    const ttfbRegression = (vitals.ttfb - budget.ttfb) / budget.ttfb;

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
    writeMetrics(testInfo, {
      ...vitals,
      regression: { lcp: lcpRegression, cls: clsRegression, fcp: fcpRegression, ttfb: ttfbRegression },
    });

    // 退化不得超过 20%
    expect(maxRegression, `最大退化 ${(maxRegression * 100).toFixed(1)}% 超阈值 20%`).toBeLessThan(
      REGRESSION_THRESHOLD,
    );
  });
});
