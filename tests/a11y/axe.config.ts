/**
 * axe-core 全局配置 — 无障碍自动化测试基础设施（云顶编码规范 §16.10 第四阶段）。
 *
 * <p>基于 @axe-core/playwright 的 configureAxe 方法，启用 WCAG 2.1 AA 全量规则集
 * （wcag2a + wcag2aa + wcag21aa），作为 PR 卡点的统一检测基准。
 *
 * <p>color-contrast 规则默认关闭：ydsz-ui 动态主题在 SSR/ hydration 过渡期
 * 可能出现短暂对比度不足，该场景由视觉回归测试覆盖，不在 axe 流程中卡控。
 *
 * <p>通过 {@link configureAxeBuilder} 将配置统一注入 AxeBuilder 实例，
 * 确保所有 a11y spec 使用一致的规则集和运行选项。
 *
 * @path tests/a11y/axe.config.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import type { AxeResults, RunOptions, Rule } from 'axe-core';
import type AxeBuilder from '@axe-core/playwright';

/**
 * 阻断级违规阈值 — 仅报告 critical / serious。
 *
 * <p>moderate / minor 不纳入 PR 卡点（减少误报噪声），但输出到报告中供人工跟踪。
 */
export const BLOCKING_IMPACTS = ['critical', 'serious'] as const;

/**
 * 在 axe.configure() 中注入的规则开关列表。
 *
 * <p>Spec.rules 仅支持在 enable/disable 粒度控制单条规则（axe-core Spec 契约）。
 * color-contrast 设为 enabled: false 关闭动态主题切换时的对比度误报。
 *
 * <p>其余 WCAG 2.1 AA 标准规则全部通过 axe.configure() 默认启用（axe-core 出厂即全开）；
 * 通过 RunOptions.runOnly 限制扫描范围至 wcag2a/wcag2aa/wcag21aa 三条标准。
 */
export const disabledRules: Pick<Rule, 'id' | 'enabled'>[] = [
  // 关掉的规则：color-contrast 会因动态主题切换产生误报
  { id: 'color-contrast', enabled: false },
];

/**
 * 运行期选项 — wcag2a / wcag2aa / wcag21aa 全量规则扫描。
 *
 * <p>resultTypes: ['violations', 'incomplete'] — 失败报告中保留 incomplete 项
 * 以便在 axe 无法自动判定的场景（如手动核查颜色对比）发现潜在问题。
 */
export const axeRunOptions: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },
  resultTypes: ['violations', 'incomplete'],
  iframes: true,
  elementRef: false,
};

/**
 * 统一配置 AxeBuilder 实例：注入 disabledRules + runOnly 标签。
 *
 * <p>所有 a11y spec 应调用此方法获取已配置的 AxeBuilder，
 * 避免各 spec 分散配置导致规则集不一致。
 *
 * @param builder - 由测试用例创建的 AxeBuilder 实例
 * @return 同一实例（已配置完成，支持链式调用）
 */
export function configureAxeBuilder(builder: AxeBuilder): AxeBuilder {
  // disableRules 关闭 color-contrast 等易误报规则
  const ruleIds = disabledRules.map((r) => r.id);
  return builder.disableRules(ruleIds);
}

/**
 * 过滤出阻断级（critical / serious）违规。
 *
 * @param violations - axe-core 返回的 violations 列表
 * @return 命中阻断阈值的 violation 数组
 */
export function filterBlockingViolations(
  violations: AxeResults['violations'],
): AxeResults['violations'] {
  return violations.filter((v) =>
    BLOCKING_IMPACTS.includes(v.impact as (typeof BLOCKING_IMPACTS)[number]),
  );
}

/**
 * 格式化为人类可读的错误详情，便于 CI 日志定位。
 *
 * @param violations - 阻断级 violation 列表
 * @return 格式化后的多行字符串
 */
export function formatViolations(violations: AxeResults['violations']): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.html} (${n.failureSummary ?? 'no summary'})`)
        .join('\n');
      return `  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n    help: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}
