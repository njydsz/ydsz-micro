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

import type { Spec, RunOptions } from 'axe-core';

/**
 * axe-core 配置 spec — 启用 WCAG 2.1 AA 全量规则。
 *
 * <p>规则集覆盖：
 * <ul>
 *   <li>wcag2a  — WCAG 2.0 A 级</li>
 *   <li>wcag2aa — WCAG 2.0 AA 级</li>
 *   <li>wcag21aa — WCAG 2.1 AA 级</li>
 * </ul>
 *
 * <p>color-contrast 单独设为 false：ydsz-ui 动态主题切换时，axe-core 在页面
 * 初瞬态采样颜色可能未稳定，产生误报。对比度问题交由视觉回归 + 设计 token 静态检查。
 */
export const axeConfig: Spec = {
  rules: [
    // 关掉的规则：color-contrast 会因动态主题切换产生误报
    { id: 'color-contrast', enabled: false },
  ],
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
};

/**
 * 运行期选项 — 决定结果输出格式与检测边界。
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
