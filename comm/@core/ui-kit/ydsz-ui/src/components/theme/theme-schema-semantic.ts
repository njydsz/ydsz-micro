/**
 * YDSZ Design Token Schema —— semantic 层。
 *
 * 语义化命名（--primary / --background / --foreground 等），引用 base 层色阶，
 * 含 darkValue 用于暗色切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme\theme-schema-semantic.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { TokenCategory, TokenLayer } from './theme-schema-types';
import type { TokenDefinition } from './theme-schema-types';

/**
 * semantic 层 token 注册表：引用 base 层色阶作为语义化命名。
 */
export const semanticTokens = {
  // ===== 语义色 =====
  primary: {
    category: TokenCategory.COLOR,
    cssVar: 'primary',
    defaultValue: '222.2 47.4% 11.2%',
    description: '主题主色：主按钮、主链接、关键操作点',
    layer: TokenLayer.SEMANTIC,
  },
  'primary-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'primary-foreground',
    defaultValue: '210 40% 98%',
    description: '前景色（在 primary 背景上的文本）',
    layer: TokenLayer.SEMANTIC,
  },
  'primary-hover': {
    category: TokenCategory.COLOR,
    cssVar: 'primary-hover',
    defaultValue: '217.2 32.6% 17.5%',
    description: '主色 hover 态背景',
    layer: TokenLayer.SEMANTIC,
  },
  secondary: {
    category: TokenCategory.COLOR,
    cssVar: 'secondary',
    defaultValue: '210 40% 96.1%',
    description: '次级背景：卡片、嵌套容器',
    layer: TokenLayer.SEMANTIC,
  },
  'secondary-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'secondary-foreground',
    defaultValue: '222.2 47.4% 11.2%',
    description: '次级前景色',
    layer: TokenLayer.SEMANTIC,
  },
  accent: {
    category: TokenCategory.COLOR,
    cssVar: 'accent',
    defaultValue: '210 40% 96.1%',
    description: '强调色：hover 行、选中态',
    layer: TokenLayer.SEMANTIC,
  },
  'accent-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'accent-foreground',
    defaultValue: '222.2 47.4% 11.2%',
    description: '强调色上的前景色',
    layer: TokenLayer.SEMANTIC,
  },
  destructive: {
    category: TokenCategory.COLOR,
    cssVar: 'destructive',
    defaultValue: '0 84.2% 60.2%',
    description: '危险操作：删除、错误态',
    layer: TokenLayer.SEMANTIC,
  },
  'destructive-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'destructive-foreground',
    defaultValue: '210 40% 98%',
    description: '危险色上的前景色',
    layer: TokenLayer.SEMANTIC,
  },
  success: {
    category: TokenCategory.COLOR,
    cssVar: 'success',
    defaultValue: '142.1 76.2% 36.3%',
    darkValue: '142 70.6% 45.3%',
    description: '成功操作：保存成功、校验通过',
    layer: TokenLayer.SEMANTIC,
  },
  'success-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'success-foreground',
    defaultValue: '210 40% 98%',
    description: '成功色上的前景色',
    layer: TokenLayer.SEMANTIC,
  },
  warning: {
    category: TokenCategory.COLOR,
    cssVar: 'warning',
    defaultValue: '38 92.2% 50.2%',
    darkValue: '43 96% 56.1%',
    description: '警告操作：校验提醒、非致命错误',
    layer: TokenLayer.SEMANTIC,
  },
  'warning-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'warning-foreground',
    defaultValue: '210 40% 98%',
    description: '警告色上的前景色',
    layer: TokenLayer.SEMANTIC,
  },
  info: {
    category: TokenCategory.COLOR,
    cssVar: 'info',
    defaultValue: '221.2 83.2% 53.3%',
    darkValue: '217.2 91.2% 59.8%',
    description: '信息提示：辅助说明、品牌色',
    layer: TokenLayer.SEMANTIC,
  },

  // ===== 中性色 =====
  background: {
    category: TokenCategory.COLOR,
    cssVar: 'background',
    defaultValue: '0 0% 100%',
    darkValue: '222.2 84% 4.9%',
    description: '页面背景色',
    layer: TokenLayer.SEMANTIC,
  },
  foreground: {
    category: TokenCategory.COLOR,
    cssVar: 'foreground',
    defaultValue: '222.2 84% 4.9%',
    darkValue: '210 40% 98%',
    description: '默认前景色（正文）',
    layer: TokenLayer.SEMANTIC,
  },
  muted: {
    category: TokenCategory.COLOR,
    cssVar: 'muted',
    defaultValue: '210 40% 96.1%',
    description: '弱化背景：禁用态、表头背景',
    layer: TokenLayer.SEMANTIC,
  },
  'muted-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'muted-foreground',
    defaultValue: '215.4 16.3% 46.9%',
    description: '弱化文本色：副标题、提示',
    layer: TokenLayer.SEMANTIC,
  },
  card: {
    category: TokenCategory.COLOR,
    cssVar: 'card',
    defaultValue: '0 0% 100%',
    description: '卡片背景',
    layer: TokenLayer.SEMANTIC,
  },
  'card-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'card-foreground',
    defaultValue: '222.2 84% 4.9%',
    description: '卡片文本色',
    layer: TokenLayer.SEMANTIC,
  },
  popover: {
    category: TokenCategory.COLOR,
    cssVar: 'popover',
    defaultValue: '0 0% 100%',
    description: '浮层背景',
    layer: TokenLayer.SEMANTIC,
  },
  'popover-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'popover-foreground',
    defaultValue: '222.2 84% 4.9%',
    description: '浮层文本色',
    layer: TokenLayer.SEMANTIC,
  },
  border: {
    category: TokenCategory.COLOR,
    cssVar: 'border',
    defaultValue: '214.3 31.8% 91.4%',
    description: '边框色',
    layer: TokenLayer.SEMANTIC,
  },
  input: {
    category: TokenCategory.COLOR,
    cssVar: 'input',
    defaultValue: '214.3 31.8% 91.4%',
    description: '输入框边框色',
    layer: TokenLayer.SEMANTIC,
  },
  ring: {
    category: TokenCategory.COLOR,
    cssVar: 'ring',
    defaultValue: '222.2 84% 4.9%',
    description: 'focus ring 色',
    layer: TokenLayer.SEMANTIC,
  },

  // ===== 圆角系统 =====
  radius: {
    category: TokenCategory.SIZE,
    cssVar: 'radius',
    defaultValue: '0.5rem',
    description: '基础圆角（按钮、卡片、弹窗统一）',
    layer: TokenLayer.SEMANTIC,
  },
  'radius-sm': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-sm',
    defaultValue: 'calc(0.5rem - 4px)',
    description: '小圆角：标签、小按钮',
    layer: TokenLayer.SEMANTIC,
  },
  'radius-md': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-md',
    defaultValue: 'calc(0.5rem - 2px)',
    description: '中圆角：下拉项、嵌套卡片',
    layer: TokenLayer.SEMANTIC,
  },
  'radius-lg': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-lg',
    defaultValue: '0.5rem',
    description: '大圆角：浮层面板',
    layer: TokenLayer.SEMANTIC,
  },
  'radius-xl': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-xl',
    defaultValue: 'calc(0.5rem + 4px)',
    description: '特大圆角：模态弹窗',
    layer: TokenLayer.SEMANTIC,
  },

  // ===== 阴影系统 =====
  'shadow-raised-100': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-100',
    defaultValue: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    description: '层级 1：悬浮卡片、下拉框',
    layer: TokenLayer.SEMANTIC,
  },
  'shadow-raised-200': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-200',
    defaultValue: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    description: '层级 2：模态弹窗',
    layer: TokenLayer.SEMANTIC,
  },
  'shadow-raised-300': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-300',
    defaultValue: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    description: '层级 3：抽屉、重型浮层',
    layer: TokenLayer.SEMANTIC,
  },

  // ===== 字号系统 =====
  'text-10': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-10',
    defaultValue: '0.625rem',
    description: '10px：标签脚注',
    layer: TokenLayer.SEMANTIC,
  },
  'text-12': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-12',
    defaultValue: '0.75rem',
    description: '12px：辅助文字',
    layer: TokenLayer.SEMANTIC,
  },
  'text-14': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-14',
    defaultValue: '0.875rem',
    description: '14px：默认正文',
    layer: TokenLayer.SEMANTIC,
  },
  'text-16': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-16',
    defaultValue: '1rem',
    description: '16px：次级标题',
    layer: TokenLayer.SEMANTIC,
  },
  'h2-size': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'h2-size',
    defaultValue: '1.5rem',
    description: 'h2 标题字号',
    layer: TokenLayer.SEMANTIC,
  },
  'h3-size': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'h3-size',
    defaultValue: '1.25rem',
    description: 'h3 标题字号',
    layer: TokenLayer.SEMANTIC,
  },

  // ===== 动效系统 =====
  'ease-default': {
    category: TokenCategory.ANIMATION,
    cssVar: 'ease-default',
    defaultValue: 'cubic-bezier(0.2, 0, 0, 1)',
    description: '标准进出动画缓动',
    layer: TokenLayer.SEMANTIC,
  },
  'ease-spring': {
    category: TokenCategory.ANIMATION,
    cssVar: 'ease-spring',
    defaultValue: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    description: '弹性缓动：弹窗缩放、抽屉推出',
    layer: TokenLayer.SEMANTIC,
  },
  'duration-fast': {
    category: TokenCategory.ANIMATION,
    cssVar: 'duration-fast',
    defaultValue: '150ms',
    description: '快过渡：按钮 hover、颜色切换',
    layer: TokenLayer.SEMANTIC,
  },
  'duration-default': {
    category: TokenCategory.ANIMATION,
    cssVar: 'duration-default',
    defaultValue: '200ms',
    description: '默认过渡：展开/收起、浮层淡入淡出',
    layer: TokenLayer.SEMANTIC,
  },
} as const satisfies Record<string, TokenDefinition>;
