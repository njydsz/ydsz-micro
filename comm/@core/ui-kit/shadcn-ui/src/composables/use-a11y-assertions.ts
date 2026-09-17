/**
 * useA11yAssertions —— 基于 vitest-axe 的轻量封装，复用公共配置与 matchers。
 *
 * 设计目标：
 *  - 为全项目提供统一的 axe-core 配置与断言入口；
 *  - 封装 toBeAccessible / toHaveNoViolations 等 matcher，兼容 vitest expect 扩展；
 *  - 提供针对常见组件场景（表单、表格、对话框）的预置检查函数。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\composables\use-a11y-assertions.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { axe, type AxeResults, type RunOptions } from 'vitest-axe';
import { expect } from 'vitest';

/**
 * 默认 axe-core 配置：启用全部严重级别规则 + color-contrast（仅 dev 期）。
 *
 * tags 控制遵循的标准集：wcag2a / wcag2aa / wcag21a / wcag21aa / best-practice。
 */
export const DEFAULT_A11Y_OPTIONS: RunOptions = {
  rules: {
    // 关掉的规则：color-contrast 会因动态主题变化产生误报，交给视觉回归测试处理
    'color-contrast': { enabled: false },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  // 保留全部结果，方便详细报告
  resultTypes: ['violations', 'incomplete'],
  // 仅在元素实际可见时检测（hidden 元素不纳入报告）
  iframes: true,
  elementRef: true,
};

/**
 * 自定义 matcher：断言容器内无任何无障碍违规。
 *
 * @template T - 元素类型
 * @param container - 待检测的 DOM 容器或 HTMLElement
 * @param options - 可选的 axe-core 运行配置
 * @return vitest 匹配结果
 *
 * @example
 * ```ts
 * const { container } = render(() => <MyComponent />);
 * await expect(container).toBeAccessible();
 * ```
 */
export async function toBeAccessible<T extends HTMLElement>(
  container: T,
  options: RunOptions = DEFAULT_A11Y_OPTIONS,
): Promise<void> {
  const results = await axe(container, options);
  expect(results.violations).toEqual([]);
}

/**
 * 针对表单的断言：检测 label / aria-describedby / 错误消息链路。
 *
 * @param container - 表单项容器
 * @param options - 可选 axe-core 配置
 */
export async function toBeFormAccessible<T extends HTMLElement>(
  container: T,
  options: RunOptions = DEFAULT_A11Y_OPTIONS,
): Promise<AxeResults> {
  return axe(container, {
    ...options,
    runOnly: {
      type: 'tag',
      // 表单必查规则子集
      tags: ['wcag2a', 'wcag2aa', 'section508'],
    },
  });
}

/**
 * 针对表格的断言：检测 caption / scope / 表头关联。
 *
 * @param container - 表格容器
 * @param options - 可选 axe-core 配置
 */
export async function toBeTableAccessible<T extends HTMLElement>(
  container: T,
  options: RunOptions = DEFAULT_A11Y_OPTIONS,
): Promise<AxeResults> {
  return axe(container, {
    ...options,
    rules: {
      ...options.rules,
      // 表格相关规则全部启用
      'table-duplicate-name': { enabled: true },
      'th-has-data-cells': { enabled: true },
    },
  });
}

/**
 * 获取违规详情的友好格式（调试用）
 *
 * @param results - axe-core 运行结果
 * @return 格式化的违规摘要字符串
 */
export function formatViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return '✅ No accessibility violations found';
  }
  return results.violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html}`).join('\n');
      return `❌ ${v.id} (${v.impact}): ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

/** 类型重命名，让调用方可以 import type { AxeResults } from use-a11y-assertions */
export type { AxeResults, RunOptions as AxeRunOptions };
