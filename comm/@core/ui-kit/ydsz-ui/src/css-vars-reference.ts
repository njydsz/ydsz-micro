/**
 * CSS Variables Reference —— ydsz-ui 所有可用的 CSS 自定义属性（Design Tokens）。
 *
 * 本文件由 design-tokens 包导出 + 组件包内部引用汇总而成，
 * 既可供运行时脚本查询，也可被文档站引用生成可视化参考表。
 *
 * 使用方式：
 *
 * ```
 * import { CSS_VARIABLES_REFERENCE } from '@ydsz-core/ydsz-ui/css-vars-reference'
 * const token = CSS_VARIABLES_REFERENCE.find(v => v.name === '--ydsz-comp-bg')
 *
 * // CSS 中直接引用
 * // .my-component { background: hsl(var(--ydsz-comp-bg)); }
 * ```
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/css-vars-reference.ts
 * @author ydsz-team
 * @since 26.10.10
 */

export interface CssVariableReference {
  /** CSS 自定义属性名（含 -- 前缀） */
  name: string
  /** 分类 */
  category: 'color' | 'spacing' | 'shadow' | 'typography' | 'motion' | 'radius' | 'layout' | 'component' | 'other'
  /** 默认值 */
  defaultValue: string
  /** 使用描述 */
  description: string
  /** 使用示例组件 */
  usedBy?: string[]
}

/**
 * 完整 CSS 变量参考表。
 * 按 design-tokens 包 + 组件层实际使用汇总。
 */
export const CSS_VARIABLES_REFERENCE: CssVariableReference[] = [
  // ============ 颜色 — 基础色阶 (Color Primitives) ============
  { name: '--ydsz-neutral-shadow', category: 'color', defaultValue: '222 13% 31%', description: '中性色阴影基准 HSL，用于构建所有阴影 token', usedBy: ['shadow-*'] },

  // Brand 色阶
  { name: '--ydsz-color-brand-50', category: 'color', defaultValue: '222 47% 97%', description: '品牌色 50 色阶 — 极浅背景', usedBy: ['YdButton'] },
  { name: '--ydsz-color-brand-100', category: 'color', defaultValue: '222 47% 93%', description: '品牌色 100 色阶 — 浅背景' },
  { name: '--ydsz-color-brand-200', category: 'color', defaultValue: '222 47% 84%', description: '品牌色 200 色阶 — 边框/分割线' },
  { name: '--ydsz-color-brand-300', category: 'color', defaultValue: '222 47% 72%', description: '品牌色 300 色阶 — 次要图标' },
  { name: '--ydsz-color-brand-400', category: 'color', defaultValue: '222 47% 56%', description: '品牌色 400 色阶 — 暗色主题主色', usedBy: ['(dark theme)'] },
  { name: '--ydsz-color-brand-500', category: 'color', defaultValue: '222 47% 44%', description: '品牌色 500 色阶 — 主品牌色', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },
  { name: '--ydsz-color-brand-600', category: 'color', defaultValue: '222 47% 31%', description: '品牌色 600 色阶 — 悬停态', usedBy: ['YdButton'] },
  { name: '--ydsz-color-brand-700', category: 'color', defaultValue: '222 47% 22%', description: '品牌色 700 色阶 — 按下态', usedBy: ['YdButton'] },

  // Success 色阶
  { name: '--ydsz-color-success-50', category: 'color', defaultValue: '142 71% 97%', description: '成功色 50 色阶' },
  { name: '--ydsz-color-success-100', category: 'color', defaultValue: '142 71% 93%', description: '成功色 100 色阶' },
  { name: '--ydsz-color-success-200', category: 'color', defaultValue: '142 71% 84%', description: '成功色 200 色阶' },
  { name: '--ydsz-color-success-300', category: 'color', defaultValue: '142 71% 70%', description: '成功色 300 色阶' },
  { name: '--ydsz-color-success-400', category: 'color', defaultValue: '142 71% 56%', description: '成功色 400 色阶' },
  { name: '--ydsz-color-success-500', category: 'color', defaultValue: '142 71% 45%', description: '成功色 500 色阶 — 主成功色' },
  { name: '--ydsz-color-success-600', category: 'color', defaultValue: '142 71% 36%', description: '成功色 600 色阶' },
  { name: '--ydsz-color-success-700', category: 'color', defaultValue: '142 71% 28%', description: '成功色 700 色阶' },

  // Warning 色阶
  { name: '--ydsz-color-warning-50', category: 'color', defaultValue: '38 92% 97%', description: '警告色 50 色阶' },
  { name: '--ydsz-color-warning-100', category: 'color', defaultValue: '38 92% 93%', description: '警告色 100 色阶' },
  { name: '--ydsz-color-warning-200', category: 'color', defaultValue: '38 92% 84%', description: '警告色 200 色阶' },
  { name: '--ydsz-color-warning-300', category: 'color', defaultValue: '38 92% 72%', description: '警告色 300 色阶' },
  { name: '--ydsz-color-warning-400', category: 'color', defaultValue: '38 92% 60%', description: '警告色 400 色阶' },
  { name: '--ydsz-color-warning-500', category: 'color', defaultValue: '38 92% 50%', description: '警告色 500 色阶 — 主警告色' },
  { name: '--ydsz-color-warning-600', category: 'color', defaultValue: '38 92% 40%', description: '警告色 600 色阶' },
  { name: '--ydsz-color-warning-700', category: 'color', defaultValue: '38 92% 32%', description: '警告色 700 色阶' },

  // Destructive 色阶
  { name: '--ydsz-color-destructive-50', category: 'color', defaultValue: '0 84% 97%', description: '危险色 50 色阶' },
  { name: '--ydsz-color-destructive-100', category: 'color', defaultValue: '0 84% 94%', description: '危险色 100 色阶' },
  { name: '--ydsz-color-destructive-200', category: 'color', defaultValue: '0 84% 86%', description: '危险色 200 色阶' },
  { name: '--ydsz-color-destructive-300', category: 'color', defaultValue: '0 84% 74%', description: '危险色 300 色阶' },
  { name: '--ydsz-color-destructive-400', category: 'color', defaultValue: '0 84% 64%', description: '危险色 400 色阶' },
  { name: '--ydsz-color-destructive-500', category: 'color', defaultValue: '0 84% 60%', description: '危险色 500 色阶 — 主危险色/错误色', usedBy: ['YdButton'] },
  { name: '--ydsz-color-destructive-600', category: 'color', defaultValue: '0 84% 48%', description: '危险色 600 色阶 — 悬停态', usedBy: ['YdButton'] },
  { name: '--ydsz-color-destructive-700', category: 'color', defaultValue: '0 84% 36%', description: '危险色 700 色阶 — 按下态', usedBy: ['YdButton'] },

  // Neutral 色阶
  { name: '--ydsz-color-neutral-50', category: 'color', defaultValue: '222 13% 98%', description: '中性色 50 色阶 — 最浅表面背景', usedBy: ['YdCard', 'YdDialog', 'YdInput', 'YdSelect'] },
  { name: '--ydsz-color-neutral-100', category: 'color', defaultValue: '222 13% 95%', description: '中性色 100 色阶 — 次表面背景', usedBy: ['YdTable', 'YdInput'] },
  { name: '--ydsz-color-neutral-200', category: 'color', defaultValue: '222 13% 90%', description: '中性色 200 色阶 — 默认边框' },
  { name: '--ydsz-color-neutral-300', category: 'color', defaultValue: '222 13% 78%', description: '中性色 300 色阶 — 禁用文本、强边框' },
  { name: '--ydsz-color-neutral-400', category: 'color', defaultValue: '222 13% 60%', description: '中性色 400 色阶 — 三级文本、悬停边框' },
  { name: '--ydsz-color-neutral-500', category: 'color', defaultValue: '222 13% 44%', description: '中性色 500 色阶 — 次级文本' },
  { name: '--ydsz-color-neutral-600', category: 'color', defaultValue: '222 13% 31%', description: '中性色 600 色阶 — 主要文本' },
  { name: '--ydsz-color-neutral-700', category: 'color', defaultValue: '222 13% 20%', description: '中性色 700 色阶 — 最深文本' },

  // ============ 颜色 — 语义色 (Semantic Colors) ============
  { name: '--ydsz-surface-1', category: 'color', defaultValue: 'var(--ydsz-color-neutral-50)', description: '主表面背景（卡片、弹窗、输入框）', usedBy: ['YdCard', 'YdDialog', 'YdInput', 'YdSelect', 'YdDropdownMenu', 'YdContextMenu', 'YdTable'] },
  { name: '--ydsz-surface-2', category: 'color', defaultValue: 'var(--ydsz-color-neutral-100)', description: '次表面背景（表头、禁用输入框）', usedBy: ['YdInput', 'YdTable', 'YdSlider'] },
  { name: '--ydsz-surface-3', category: 'color', defaultValue: 'var(--ydsz-color-neutral-200)', description: '三级表面背景（侧边栏、菜单）' },

  { name: '--ydsz-text-primary', category: 'color', defaultValue: 'var(--ydsz-color-neutral-700)', description: '主要文本颜色', usedBy: ['YdButton', 'YdInput', 'YdSelect', 'YdCard', 'YdTable', 'YdConfigProvider'] },
  { name: '--ydsz-text-secondary', category: 'color', defaultValue: 'var(--ydsz-color-neutral-500)', description: '次要文本颜色（标签、描述、表头）', usedBy: ['YdButton', 'YdCard', 'YdTable'] },
  { name: '--ydsz-text-tertiary', category: 'color', defaultValue: 'var(--ydsz-color-neutral-400)', description: '三级文本颜色（占位符、图标）', usedBy: ['YdInput', 'YdSelect'] },
  { name: '--ydsz-text-disabled', category: 'color', defaultValue: 'var(--ydsz-color-neutral-300)', description: '禁用文本颜色', usedBy: ['YdInput', 'YdSelect'] },
  { name: '--ydsz-text-inverse', category: 'color', defaultValue: '0 0% 100%', description: '反色文本（用于深色背景上的文字）', usedBy: ['YdButton'] },

  { name: '--ydsz-border-default', category: 'color', defaultValue: 'var(--ydsz-color-neutral-200)', description: '默认边框颜色', usedBy: ['YdButton', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-border-strong', category: 'color', defaultValue: 'var(--ydsz-color-neutral-300)', description: '强调边框颜色' },
  { name: '--ydsz-border-subtle', category: 'color', defaultValue: 'var(--ydsz-color-neutral-100)', description: '弱化边框颜色（卡片分割线、表头底边框）', usedBy: ['YdCard', 'YdTable'] },

  // ============ 动效 (Motion) ============
  { name: '--ydsz-motion-duration-instant', category: 'motion', defaultValue: '100ms', description: '瞬时动画时长 — hover / focus ring', usedBy: [] },
  { name: '--ydsz-motion-duration-fast', category: 'motion', defaultValue: '150ms', description: '快速动画时长 — switch / toggle / tab 切换', usedBy: ['YdButton', 'YdSelect', 'YdInput', 'YdTable'] },
  { name: '--ydsz-motion-duration-normal', category: 'motion', defaultValue: '200ms', description: '标准动画时长 — dropdown / modal enter', usedBy: ['YdCard', 'YdButton', 'YdConfigProvider'] },
  { name: '--ydsz-motion-duration-slow', category: 'motion', defaultValue: '300ms', description: '慢速动画时长 — drawer / 大型面板' },
  { name: '--ydsz-motion-duration-emphasis', category: 'motion', defaultValue: '500ms', description: '强调动画时长 — route transition' },

  { name: '--ydsz-motion-easing-linear', category: 'motion', defaultValue: 'linear', description: '线性缓动曲线' },
  { name: '--ydsz-motion-easing-standard', category: 'motion', defaultValue: 'cubic-bezier(0.4, 0, 0.2, 1)', description: '标准缓入缓出 — 最常用', usedBy: ['YdButton', 'YdSelect', 'YdInput', 'YdCard', 'YdTable', 'YdConfigProvider'] },
  { name: '--ydsz-motion-easing-ease-in', category: 'motion', defaultValue: 'cubic-bezier(0.4, 0, 1, 1)', description: '缓入曲线 — enter 动画' },
  { name: '--ydsz-motion-easing-ease-out', category: 'motion', defaultValue: 'cubic-bezier(0, 0, 0.2, 1)', description: '缓出曲线 — exit 动画' },
  { name: '--ydsz-motion-easing-spring', category: 'motion', defaultValue: 'cubic-bezier(0.34, 1.56, 0.64, 1)', description: '弹性曲线 — attention 动画' },

  // ============ 阴影 (Shadow) ============
  { name: '--ydsz-shadow-flat', category: 'shadow', defaultValue: 'none', description: '平面 — 无阴影' },
  { name: '--ydsz-shadow-low', category: 'shadow', defaultValue: '0 1px 2px 0 hsl(var(--ydsz-neutral-shadow) / 0.05), 0 1px 3px 0 hsl(var(--ydsz-neutral-shadow) / 0.1)', description: '轻微浮起 — 卡片 / tag', usedBy: ['YdCard'] },
  { name: '--ydsz-shadow-medium', category: 'shadow', defaultValue: '0 4px 6px -1px hsl(var(--ydsz-neutral-shadow) / 0.1), 0 2px 4px -2px hsl(var(--ydsz-neutral-shadow) / 0.1)', description: '中等浮起 — dropdown / popover', usedBy: ['YdCard'] },
  { name: '--ydsz-shadow-high', category: 'shadow', defaultValue: '0 10px 15px -3px hsl(var(--ydsz-neutral-shadow) / 0.1), 0 4px 6px -4px hsl(var(--ydsz-neutral-shadow) / 0.1)', description: '显著浮起 — modal / drawer', usedBy: ['YdCard'] },
  { name: '--ydsz-shadow-overlay', category: 'shadow', defaultValue: '0 25px 50px -12px hsl(var(--ydsz-neutral-shadow) / 0.25), 0 0 0 1px hsl(var(--ydsz-neutral-shadow) / 0.05)', description: '最高浮起 — command palette / global search' },

  // ============ 间距 (Spacing) ============
  { name: '--ydsz-spacing-xxs', category: 'spacing', defaultValue: '0.25rem', description: '4px — 极小间距', usedBy: ['YdButton', 'YdInput', 'YdSelect', 'YdDropdownMenu'] },
  { name: '--ydsz-spacing-xs', category: 'spacing', defaultValue: '0.5rem', description: '8px — 小间距', usedBy: ['YdButton', 'YdInput', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-spacing-sm', category: 'spacing', defaultValue: '0.75rem', description: '12px — 标准紧凑间距', usedBy: ['YdCard', 'YdInput', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-spacing-md', category: 'spacing', defaultValue: '1rem', description: '16px — 默认间距', usedBy: ['YdButton', 'YdCard', 'YdTable'] },
  { name: '--ydsz-spacing-lg20', category: 'spacing', defaultValue: '1.25rem', description: '20px — 中等间距', usedBy: ['YdSelect'] },
  { name: '--ydsz-spacing-lg', category: 'spacing', defaultValue: '1.5rem', description: '24px — 宽松间距', usedBy: ['YdButton', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-spacing-xl', category: 'spacing', defaultValue: '2rem', description: '32px — 段落间距' },
  { name: '--ydsz-spacing-2xl', category: 'spacing', defaultValue: '2.5rem', description: '40px — 区块间距' },
  { name: '--ydsz-spacing-3xl', category: 'spacing', defaultValue: '3rem', description: '48px — 大区块间距' },
  { name: '--ydsz-spacing-4xl', category: 'spacing', defaultValue: '4rem', description: '64px — 页面级间距' },

  // ============ 圆角 (Radius) ============
  { name: '--ydsz-radius-xs', category: 'radius', defaultValue: '0.125rem', description: '2px — 极小圆角' },
  { name: '--ydsz-radius-sm', category: 'radius', defaultValue: '0.25rem', description: '4px — 小圆角' },
  { name: '--ydsz-radius-md', category: 'radius', defaultValue: '0.375rem', description: '6px — 默认输入框圆角', usedBy: ['YdButton', 'YdSelect', 'YdInput', 'YdDropdownMenu'] },
  { name: '--ydsz-radius-lg', category: 'radius', defaultValue: '0.5rem', description: '8px — 卡片圆角', usedBy: ['YdCard'] },
  { name: '--ydsz-radius-xl', category: 'radius', defaultValue: '0.75rem', description: '12px — 大卡片/浮层圆角' },
  { name: '--ydsz-radius-2xl', category: 'radius', defaultValue: '1rem', description: '16px — 模态框圆角' },
  { name: '--ydsz-radius-full', category: 'radius', defaultValue: '9999px', description: '圆形/胶囊圆角', usedBy: ['YdSlider'] },

  // ============ 排版 — 字号 (Typography — Font Size) ============
  { name: '--ydsz-font-size-2xs', category: 'typography', defaultValue: '0.625rem', description: '10px — 极小标签' },
  { name: '--ydsz-font-size-xs', category: 'typography', defaultValue: '0.75rem', description: '12px — 小标签/辅助文字', usedBy: ['YdButton', 'YdInput', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-font-size-sm', category: 'typography', defaultValue: '0.875rem', description: '14px — 正文默认', usedBy: ['YdButton', 'YdCard', 'YdInput', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-font-size-base', category: 'typography', defaultValue: '1rem', description: '16px — 大正文', usedBy: ['YdButton', 'YdCard', 'YdSelect', 'YdTable'] },
  { name: '--ydsz-font-size-lg', category: 'typography', defaultValue: '1.25rem', description: '20px — 小标题' },
  { name: '--ydsz-font-size-xl', category: 'typography', defaultValue: '1.5rem', description: '24px — 卡片标题' },
  { name: '--ydsz-font-size-2xl', category: 'typography', defaultValue: '1.875rem', description: '30px — 区块标题' },
  { name: '--ydsz-font-size-3xl', category: 'typography', defaultValue: '2.25rem', description: '36px — 页面标题' },

  // ============ 排版 — 行高 (Typography — Line Height) ============
  { name: '--ydsz-line-height-tight', category: 'typography', defaultValue: '1.25', description: '1 — 紧凑标题行高' },
  { name: '--ydsz-line-height-snug', category: 'typography', defaultValue: '1.375', description: '1.375 — 标题行高' },
  { name: '--ydsz-line-height-normal', category: 'typography', defaultValue: '1.5', description: '1.5 — 正文行高' },
  { name: '--ydsz-line-height-relaxed', category: 'typography', defaultValue: '1.625', description: '1.625 — 大正文行高' },
  { name: '--ydsz-line-height-loose', category: 'typography', defaultValue: '2', description: '2 — 大标题行高' },

  // ============ 排版 — 字重 (Typography — Font Weight) ============
  { name: '--ydsz-font-weight-normal', category: 'typography', defaultValue: '400', description: '常规字重' },
  { name: '--ydsz-font-weight-medium', category: 'typography', defaultValue: '500', description: '中等字重 — 按钮默认', usedBy: ['YdButton', 'YdTable'] },
  { name: '--ydsz-font-weight-semibold', category: 'typography', defaultValue: '600', description: '半粗字重 — 卡片标题/表头', usedBy: ['YdCard', 'YdTable'] },
  { name: '--ydsz-font-weight-bold', category: 'typography', defaultValue: '700', description: '加粗字重' },

  // ============ 组件 — 焦点环 (Component — Focus Ring) ============
  { name: '--ydsz-comp-focus-ring-color', category: 'component', defaultValue: 'var(--ydsz-color-brand-500)', description: '焦点环颜色', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },
  { name: '--ydsz-comp-focus-ring-width', category: 'component', defaultValue: '2px', description: '焦点环宽度', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },
  { name: '--ydsz-comp-focus-ring-offset', category: 'component', defaultValue: '1px', description: '焦点环偏移量', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },
  { name: '--ydsz-comp-focus-ring', category: 'component', defaultValue: '0 0 0 var(--ydsz-comp-focus-ring-offset) hsl(var(--ydsz-surface-1)), 0 0 0 calc(var(--ydsz-comp-focus-ring-offset) + var(--ydsz-comp-focus-ring-width)) hsl(var(--ydsz-comp-focus-ring-color))', description: '组合焦点环阴影值', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },

  // ============ 组件 — 交互状态 (Component — Interactive States) ============
  { name: '--ydsz-comp-surface-hover', category: 'component', defaultValue: 'hsl(var(--ydsz-color-neutral-400) / 0.08)', description: '悬停态表面背景', usedBy: ['YdButton', 'YdSelect', 'YdInput', 'YdTable'] },
  { name: '--ydsz-comp-surface-active', category: 'component', defaultValue: 'hsl(var(--ydsz-color-neutral-400) / 0.12)', description: '按下态表面背景', usedBy: ['YdButton'] },
  { name: '--ydsz-comp-surface-selected', category: 'component', defaultValue: 'hsl(var(--ydsz-color-brand-500) / 0.10)', description: '选中态表面背景' },
  { name: '--ydsz-comp-surface-disabled', category: 'component', defaultValue: 'var(--ydsz-surface-2)', description: '禁用态表面背景', usedBy: ['YdInput', 'YdSelect'] },

  { name: '--ydsz-comp-border-hover', category: 'component', defaultValue: 'var(--ydsz-color-neutral-400)', description: '悬停态边框颜色', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },
  { name: '--ydsz-comp-border-focus', category: 'component', defaultValue: 'var(--ydsz-color-brand-500)', description: '聚焦态边框颜色', usedBy: ['YdButton', 'YdSelect', 'YdInput'] },

  // ============ 组件 — 危险操作 (Component — Danger) ============
  { name: '--ydsz-comp-danger-bg', category: 'component', defaultValue: 'hsl(var(--ydsz-color-destructive-500))', description: '危险按钮背景色', usedBy: ['YdButton'] },
  { name: '--ydsz-comp-danger-bg-hover', category: 'component', defaultValue: 'hsl(var(--ydsz-color-destructive-600))', description: '危险按钮悬停背景色', usedBy: ['YdButton'] },
  { name: '--ydsz-comp-danger-bg-active', category: 'component', defaultValue: 'hsl(var(--ydsz-color-destructive-700))', description: '危险按钮按下背景色', usedBy: ['YdButton'] },
  { name: '--ydsz-comp-danger-text', category: 'component', defaultValue: 'var(--ydsz-text-inverse)', description: '危险按钮文本色', usedBy: ['YdButton'] },
  { name: '--ydsz-comp-danger-border', category: 'component', defaultValue: 'hsl(var(--ydsz-color-destructive-600))', description: '危险按钮边框色', usedBy: ['YdButton'] },
]

/**
 * 按分类分组的 token 映射。
 */
export const CSS_VARIABLES_BY_CATEGORY: Record<string, CssVariableReference[]> = (() => {
  const grouped: Record<string, CssVariableReference[]> = {}
  for (const v of CSS_VARIABLES_REFERENCE) {
    if (!grouped[v.category]) grouped[v.category] = []
    grouped[v.category]!.push(v)
  }
  return grouped
})()

/**
 * 查询指定组件使用的所有 CSS 变量。
 */
export function getCssVarsForComponent(componentName: string): CssVariableReference[] {
  return CSS_VARIABLES_REFERENCE.filter(v => v.usedBy?.includes(componentName))
}

/**
 * 获取某个分类下的所有变量名。
 */
export function getCssVarNamesByCategory(category: string): string[] {
  return (CSS_VARIABLES_BY_CATEGORY[category] ?? []).map(v => v.name)
}

/**
 * 密度档位 CSS 变量映射。
 *
 * 各档位定义按钮的高度 / 水平内边距 / 字号自定义属性，
 * 组件通过 `var(--btn-h)` 等引用实现密度切换而不必重写组件样式。
 *
 * @since 1.0.0
 */
export const DENSITY_VARS: Record<'compact' | 'default' | 'large', Record<string, string>> = {
  compact: {
    '--btn-h': '1.75rem',
    '--btn-px': '0.5rem',
    '--btn-fs': '0.75rem',
    '--input-h': '1.75rem',
    '--input-px': '0.5rem',
    '--input-fs': '0.75rem',
    '--select-h': '1.75rem',
    '--select-px': '0.5rem',
    '--select-fs': '0.75rem',
  },
  default: {
    '--btn-h': '2.25rem',
    '--btn-px': '1rem',
    '--btn-fs': '0.875rem',
    '--input-h': '2.25rem',
    '--input-px': '0.75rem',
    '--input-fs': '0.875rem',
    '--select-h': '2.25rem',
    '--select-px': '0.75rem',
    '--select-fs': '0.875rem',
  },
  large: {
    '--btn-h': '2.75rem',
    '--btn-px': '1.25rem',
    '--btn-fs': '1rem',
    '--input-h': '2.75rem',
    '--input-px': '0.75rem',
    '--input-fs': '1rem',
    '--select-h': '2.75rem',
    '--select-px': '0.75rem',
    '--select-fs': '1rem',
  },
}
