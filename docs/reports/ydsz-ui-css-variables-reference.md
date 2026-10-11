# YDSZ UI — CSS Variables Reference

> 分析日期: 2026-10-10  
> 包: `@ydsz-core/ydsz-ui`  
> Token 来源: `@ydsz-core/design-tokens` + 组件层内部引用

## 分类概览

| 分类 | 变量数 | 说明 |
|------|--------|------|
| Colors (颜色 - 色阶) | 41 | Brand/Success/Warning/Destructive/Neutral 五色 × 8 阶 + 阴影基准 |
| Colors (颜色 - 语义) | 11 | Surface / Text / Border 语义抽象 |
| Shadow (阴影) | 5 | flat / low / medium / high / overlay |
| Motion (动效) | 10 | 5 时长 + 5 缓动曲线 |
| Spacing (间距) | 10 | 4px ~ 64px，4 倍数网格系统 |
| Radius (圆角) | 7 | 2px ~ 9999px（圆形） |
| Typography (排版) | 17 | 字号 8 + 行高 5 + 字重 4 |
| Component (组件级) | 12 | 焦点环 + 交互状态 + 危险操作 |
| **合计** | **113** | |

---

## Colors — 基础色阶 (Color Primitives)

### 通用

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `--ydsz-neutral-shadow` | `222 13% 31%` | 中性色阴影基准 HSL，用于构建所有 shadow token |

### Brand 色阶

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-color-brand-50` | `222 47% 97%` | YdButton | 品牌色 50 — 极浅背景 |
| `--ydsz-color-brand-100` | `222 47% 93%` | — | 品牌色 100 — 浅背景 |
| `--ydsz-color-brand-200` | `222 47% 84%` | — | 品牌色 200 — 边框/分割线 |
| `--ydsz-color-brand-300` | `222 47% 72%` | — | 品牌色 300 — 次要图标 |
| `--ydsz-color-brand-400` | `222 47% 56%` | (暗色主题) | 品牌色 400 — 暗色主题焦点环 |
| `--ydsz-color-brand-500` | `222 47% 44%` | YdButton, YdSelect, YdInput | 品牌色 500 — 主品牌色 |
| `--ydsz-color-brand-600` | `222 47% 31%` | YdButton | 品牌色 600 — 悬停态 |
| `--ydsz-color-brand-700` | `222 47% 22%` | YdButton | 品牌色 700 — 按下态 |

### Success 色阶

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `--ydsz-color-success-50` | `142 71% 97%` | 成功色 50 |
| `--ydsz-color-success-100` | `142 71% 93%` | 成功色 100 |
| `--ydsz-color-success-200` | `142 71% 84%` | 成功色 200 |
| `--ydsz-color-success-300` | `142 71% 70%` | 成功色 300 |
| `--ydsz-color-success-400` | `142 71% 56%` | 成功色 400 |
| `--ydsz-color-success-500` | `142 71% 45%` | 成功色 500 — 主成功色 |
| `--ydsz-color-success-600` | `142 71% 36%` | 成功色 600 |
| `--ydsz-color-success-700` | `142 71% 28%` | 成功色 700 |

### Warning 色阶

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `--ydsz-color-warning-50` | `38 92% 97%` | 警告色 50 |
| `--ydsz-color-warning-100` | `38 92% 93%` | 警告色 100 |
| `--ydsz-color-warning-200` | `38 92% 84%` | 警告色 200 |
| `--ydsz-color-warning-300` | `38 92% 72%` | 警告色 300 |
| `--ydsz-color-warning-400` | `38 92% 60%` | 警告色 400 |
| `--ydsz-color-warning-500` | `38 92% 50%` | 警告色 500 — 主警告色 |
| `--ydsz-color-warning-600` | `38 92% 40%` | 警告色 600 |
| `--ydsz-color-warning-700` | `38 92% 32%` | 警告色 700 |

### Destructive 色阶

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-color-destructive-50` | `0 84% 97%` | — | 危险色 50 |
| `--ydsz-color-destructive-100` | `0 84% 94%` | — | 危险色 100 |
| `--ydsz-color-destructive-200` | `0 84% 86%` | — | 危险色 200 |
| `--ydsz-color-destructive-300` | `0 84% 74%` | — | 危险色 300 |
| `--ydsz-color-destructive-400` | `0 84% 64%` | — | 危险色 400 |
| `--ydsz-color-destructive-500` | `0 84% 60%` | YdButton | 危险色 500 — 主危险色 |
| `--ydsz-color-destructive-600` | `0 84% 48%` | YdButton | 危险色 600 — 悬停态 |
| `--ydsz-color-destructive-700` | `0 84% 36%` | YdButton | 危险色 700 — 按下态 |

### Neutral 色阶

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-color-neutral-50` | `222 13% 98%` | YdCard, YdDialog, YdInput, YdSelect | 中性色 50 — 最浅表面背景 |
| `--ydsz-color-neutral-100` | `222 13% 95%` | YdTable, YdInput | 中性色 100 — 次表面背景 |
| `--ydsz-color-neutral-200` | `222 13% 90%` | — | 中性色 200 — 默认边框 |
| `--ydsz-color-neutral-300` | `222 13% 78%` | — | 中性色 300 — 禁用文本、强边框 |
| `--ydsz-color-neutral-400` | `222 13% 60%` | — | 中性色 400 — 三级文本、悬停边框 |
| `--ydsz-color-neutral-500` | `222 13% 44%` | — | 中性色 500 — 次级文本 |
| `--ydsz-color-neutral-600` | `222 13% 31%` | — | 中性色 600 — 主要文本 |
| `--ydsz-color-neutral-700` | `222 13% 20%` | — | 中性色 700 — 最深文本 |

---

## Colors — 语义色 (Semantic Colors)

### Surface（表面背景）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-surface-1` | `var(--ydsz-color-neutral-50)` | YdCard, YdDialog, YdInput, YdSelect, YdDropdownMenu, YdContextMenu, YdTable | 主表面背景 |
| `--ydsz-surface-2` | `var(--ydsz-color-neutral-100)` | YdInput, YdTable, YdSlider | 次表面背景（表头、禁用态） |
| `--ydsz-surface-3` | `var(--ydsz-color-neutral-200)` | — | 三级表面背景（侧边栏、菜单） |

### Text（文本颜色）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-text-primary` | `var(--ydsz-color-neutral-700)` | YdButton, YdInput, YdSelect, YdCard, YdTable, YdConfigProvider | 主要文本颜色 |
| `--ydsz-text-secondary` | `var(--ydsz-color-neutral-500)` | YdButton, YdCard, YdTable | 次要文本颜色（标签、描述） |
| `--ydsz-text-tertiary` | `var(--ydsz-color-neutral-400)` | YdInput, YdSelect | 三级文本颜色（占位符、图标） |
| `--ydsz-text-disabled` | `var(--ydsz-color-neutral-300)` | YdInput, YdSelect | 禁用状态文本颜色 |
| `--ydsz-text-inverse` | `0 0% 100%` | YdButton | 反色文本（深色背景上的文字） |

### Border（边框颜色）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-border-default` | `var(--ydsz-color-neutral-200)` | YdButton, YdSelect, YdTable | 默认边框颜色 |
| `--ydsz-border-strong` | `var(--ydsz-color-neutral-300)` | — | 强调边框颜色 |
| `--ydsz-border-subtle` | `var(--ydsz-color-neutral-100)` | YdCard, YdTable | 弱化边框颜色（分割线） |

---

## Motion（动效）

### Duration（时长）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-motion-duration-instant` | `100ms` | — | 瞬时反馈 (hover / focus ring) |
| `--ydsz-motion-duration-fast` | `150ms` | YdButton, YdSelect, YdInput, YdTable | 快速过渡 (switch / toggle) |
| `--ydsz-motion-duration-normal` | `200ms` | YdCard, YdButton, YdConfigProvider | 标准过渡 (dropdown / modal) |
| `--ydsz-motion-duration-slow` | `300ms` | — | 慢速过渡 (drawer / 面板展开) |
| `--ydsz-motion-duration-emphasis` | `500ms` | — | 强调动画 (route transition) |

### Easing（缓动曲线）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-motion-easing-linear` | `linear` | — | 线性 |
| `--ydsz-motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | YdButton, YdSelect, YdInput, YdCard, YdTable, YdConfigProvider | 标准缓入缓出 |
| `--ydsz-motion-easing-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | — | 缓入 (enter 动画) |
| `--ydsz-motion-easing-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | — | 缓出 (exit 动画) |
| `--ydsz-motion-easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | — | 弹性 (attention 动画) |

---

## Shadow（阴影）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-shadow-flat` | `none` | — | 平面（无阴影） |
| `--ydsz-shadow-low` | `0 1px 2px 0 ... 0.1` | YdCard | 轻微浮起（卡片/tag） |
| `--ydsz-shadow-medium` | `0 4px 6px -1px ... 0.1` | YdCard | 中等浮起（dropdown/popover） |
| `--ydsz-shadow-high` | `0 10px 15px -3px ... 0.1` | YdCard | 显著浮起（modal/drawer） |
| `--ydsz-shadow-overlay` | `0 25px 50px -12px ... 0.25` | — | 最高浮起（command palette） |

---

## Spacing（间距）

> 8px 基准的 4 倍数网格系统

| 变量名 | 默认值 | 像素值 | 使用组件 | 描述 |
|--------|--------|--------|----------|------|
| `--ydsz-spacing-xxs` | `0.25rem` | 4px | YdButton, YdInput, YdSelect, YdDropdownMenu | 极小间距 |
| `--ydsz-spacing-xs` | `0.5rem` | 8px | YdButton, YdInput, YdSelect, YdTable | 小间距 |
| `--ydsz-spacing-sm` | `0.75rem` | 12px | YdCard, YdInput, YdSelect, YdTable | 标准紧凑间距 |
| `--ydsz-spacing-md` | `1rem` | 16px | YdButton, YdCard, YdTable | 默认间距 |
| `--ydsz-spacing-lg20` | `1.25rem` | 20px | YdSelect | 中等间距 |
| `--ydsz-spacing-lg` | `1.5rem` | 24px | YdButton, YdSelect, YdTable | 宽松间距 |
| `--ydsz-spacing-xl` | `2rem` | 32px | — | 段落间距 |
| `--ydsz-spacing-2xl` | `2.5rem` | 40px | — | 区块间距 |
| `--ydsz-spacing-3xl` | `3rem` | 48px | — | 大区块间距 |
| `--ydsz-spacing-4xl` | `4rem` | 64px | — | 页面级间距 |

---

## Radius（圆角）

| 变量名 | 默认值 | 像素值 | 使用组件 | 描述 |
|--------|--------|--------|----------|------|
| `--ydsz-radius-xs` | `0.125rem` | 2px | — | 极小圆角 |
| `--ydsz-radius-sm` | `0.25rem` | 4px | — | 小圆角 |
| `--ydsz-radius-md` | `0.375rem` | 6px | YdButton, YdSelect, YdInput, YdDropdownMenu | 默认输入框圆角 |
| `--ydsz-radius-lg` | `0.5rem` | 8px | YdCard | 卡片圆角 |
| `--ydsz-radius-xl` | `0.75rem` | 12px | — | 大卡片/浮层圆角 |
| `--ydsz-radius-2xl` | `1rem` | 16px | — | 模态框圆角 |
| `--ydsz-radius-full` | `9999px` | — | YdSlider | 圆形/胶囊圆角 |

---

## Typography（排版）

### Font Size（字号）

| 变量名 | 默认值 | 像素值 | 使用组件 | 描述 |
|--------|--------|--------|----------|------|
| `--ydsz-font-size-2xs` | `0.625rem` | 10px | — | 极小标签 |
| `--ydsz-font-size-xs` | `0.75rem` | 12px | YdButton, YdInput, YdSelect, YdTable | 小标签/辅助文字 |
| `--ydsz-font-size-sm` | `0.875rem` | 14px | YdButton, YdCard, YdInput, YdSelect, YdTable | 正文默认 |
| `--ydsz-font-size-base` | `1rem` | 16px | YdButton, YdCard, YdSelect, YdTable | 大正文 |
| `--ydsz-font-size-lg` | `1.25rem` | 20px | — | 小标题 |
| `--ydsz-font-size-xl` | `1.5rem` | 24px | — | 卡片标题 |
| `--ydsz-font-size-2xl` | `1.875rem` | 30px | — | 区块标题 |
| `--ydsz-font-size-3xl` | `2.25rem` | 36px | — | 页面标题 |

### Line Height（行高）

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `--ydsz-line-height-tight` | `1.25` | 紧凑标题行高 |
| `--ydsz-line-height-snug` | `1.375` | 标题行高 |
| `--ydsz-line-height-normal` | `1.5` | 正文行高 |
| `--ydsz-line-height-relaxed` | `1.625` | 大正文行高 |
| `--ydsz-line-height-loose` | `2` | 大标题行高 |

### Font Weight（字重）

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-font-weight-normal` | `400` | — | 常规字重 |
| `--ydsz-font-weight-medium` | `500` | YdButton, YdTable | 中等字重 |
| `--ydsz-font-weight-semibold` | `600` | YdCard, YdTable | 半粗字重 |
| `--ydsz-font-weight-bold` | `700` | — | 加粗字重 |

---

## Component（组件级 Token）

### 焦点环 (Focus Ring)

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-comp-focus-ring-color` | `var(--ydsz-color-brand-500)` | YdButton, YdSelect, YdInput | 焦点环颜色 |
| `--ydsz-comp-focus-ring-width` | `2px` | YdButton, YdSelect, YdInput | 焦点环宽度 |
| `--ydsz-comp-focus-ring-offset` | `1px` | YdButton, YdSelect, YdInput | 焦点环偏移量 |
| `--ydsz-comp-focus-ring` | `0 0 0 ... (组合阴影)` | YdButton, YdSelect, YdInput | 组合焦点环阴影值 |

### 交互状态 (Interactive States)

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-comp-surface-hover` | `hsl(var(--ydsz-color-neutral-400) / 0.08)` | YdButton, YdSelect, YdInput, YdTable | 悬停态表面背景 |
| `--ydsz-comp-surface-active` | `hsl(var(--ydsz-color-neutral-400) / 0.12)` | YdButton | 按下态表面背景 |
| `--ydsz-comp-surface-selected` | `hsl(var(--ydsz-color-brand-500) / 0.10)` | — | 选中态表面背景 |
| `--ydsz-comp-surface-disabled` | `var(--ydsz-surface-2)` | YdInput, YdSelect | 禁用态表面背景 |
| `--ydsz-comp-border-hover` | `var(--ydsz-color-neutral-400)` | YdButton, YdSelect, YdInput | 悬停态边框颜色 |
| `--ydsz-comp-border-focus` | `var(--ydsz-color-brand-500)` | YdButton, YdSelect, YdInput | 聚焦态边框颜色 |

### 危险操作 (Danger)

| 变量名 | 默认值 | 使用组件 | 描述 |
|--------|--------|----------|------|
| `--ydsz-comp-danger-bg` | `hsl(var(--ydsz-color-destructive-500))` | YdButton | 危险按钮背景色 |
| `--ydsz-comp-danger-bg-hover` | `hsl(var(--ydsz-color-destructive-600))` | YdButton | 危险按钮悬停背景色 |
| `--ydsz-comp-danger-bg-active` | `hsl(var(--ydsz-color-destructive-700))` | YdButton | 危险按钮按下背景色 |
| `--ydsz-comp-danger-text` | `var(--ydsz-text-inverse)` | YdButton | 危险按钮文本色 |
| `--ydsz-comp-danger-border` | `hsl(var(--ydsz-color-destructive-600))` | YdButton | 危险按钮边框色 |

---

## 暗色主题覆盖

暗色主题通过 `[data-theme='dark']` 覆盖以下变量：

- `--ydsz-color-neutral-50` ~ `--ydsz-color-neutral-700` — 色阶反转
- `--ydsz-surface-1` / `2` / `3` — 使用反转后的低阶中性色
- `--ydsz-text-primary` ~ `--ydsz-text-disabled` — 使用反转后的高阶中性色
- `--ydsz-border-default` / `strong` / `subtle` — 使用反转后边框
- `--ydsz-shadow-*` — 不透明度增强 (0.15 ~ 0.5)
- `--ydsz-comp-surface-hover` / `active` — 不透明度上调 (0.16 / 0.24)
- `--ydsz-comp-surface-selected` — 使用 brand-400 提升可见度
- `--ydsz-comp-focus-ring-color` — 使用 brand-400 提升可见度

---

## 使用示例

### 在 TypeScript 中查询

```typescript
import {
  CSS_VARIABLES_REFERENCE,
  getCssVarsForComponent,
  getCssVarNamesByCategory,
} from '@ydsz-core/ydsz-ui/css-vars-reference'

// 查询所有 color 分类的变量名
const colorVars = getCssVarNamesByCategory('color')

// 查询某个组件使用的变量
const buttonVars = getCssVarsForComponent('YdButton')
```

### 在 CSS 中引用

```css
.my-component {
  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-md);
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  font-size: var(--ydsz-font-size-sm);
  font-weight: var(--ydsz-font-weight-medium);
  transition: background-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

.my-component:hover {
  background-color: var(--ydsz-comp-surface-hover);
}
```
