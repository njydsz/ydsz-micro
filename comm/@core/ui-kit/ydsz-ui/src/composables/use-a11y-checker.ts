/**
 * useA11yChecker composable —— 自动化可访问性检查入口。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-a11y-checker.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import type { RunOptions } from 'axe-core';
import type { Ref } from 'vue';

import { ref } from 'vue';

/** a11y 检查结果摘要 */
export interface A11yCheckResult {
  isClean: boolean;
  violationCount: number;
  violations: Array<{ description: string; id: string; impact: string }>;
}

/**
 * useA11yChecker —— 可访问性测试工厂函数。
 *
 * @param containerRef - 被测容器元素
 * @param options - axe-core 配置
 * @returns checker 控制接口
 */
export function useA11yChecker(
  containerRef: Ref<HTMLElement | undefined>,
  options: RunOptions = {},
): {
  check: () => Promise<A11yCheckResult>;
  isComplete: Ref<boolean>;
  lastResult: Ref<A11yCheckResult | null>;
} {
  const lastResult = ref<A11yCheckResult | null>(null);
  const isComplete = ref(false);

  async function check(): Promise<A11yCheckResult> {
    const axe = await import('axe-core');
    const container = containerRef.value;
    if (!container) {
      return { isClean: true, violationCount: 0, violations: [] };
    }

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'empty-heading': { enabled: true },
        'heading-order': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'region': { enabled: true },
      },
      ...options,
    });

    const summary: A11yCheckResult = {
      isClean: results.violations.length === 0,
      violationCount: results.violations.length,
      violations: results.violations.map((v) => ({
        description: v.description,
        id: v.id,
        impact: v.impact ?? 'minor',
      })),
    };
    lastResult.value = summary;
    isComplete.value = true;
    return summary;
  }

  return { check, isComplete, lastResult };
}
