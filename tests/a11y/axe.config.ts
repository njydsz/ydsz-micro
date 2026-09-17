/**
 * axe-core 全局配置 — 无障碍自动化测试基础设施（云顶编码规范 §16.10 第四阶段）。
 *
 * <p>基于 @axe-core/playwright 的 configureAxe 方法，启用 WCAG 2.1 AA 全量规则集
 * （wcag2a + wcag2aa + wcag21aa），作为 PR 卡点的统一检测基准。
 *
 * <p>color-contrast 规则默认关闭：ydsz-ui 动态主题在 SSR/ hydration 过渡期
 * 可能出现短暂对比度不足，该场景由视觉回归测试覆盖，不在 axe 流程中卡控。
 *
 * @path tests/a11y/axe.config.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import type { RunOptions, Rule } from 'axe-core';

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
