/**
 * YDSZ Design Token Schema —— 类型安全的 CSS 变量注册表。
 *
 * 设计目标：
 *  - 把散落在组件 / tailwind 配置里的所有 CSS 变量收敛到一处，避免命名漂移；
 *  - 每个 token 都有 JSDoc 说明用途、默认值、可选暗夜值；
 *  - 运行时通过 @see useTheme composable 动态注入，无需重新构建。
 *
 * Token 命名规范：
 *  - 颜色类：--{语义}-{modifier}，如 --primary / --primary-foreground
 *  - 半径类：--radius-{scale}，如 --radius / --radius-sm / --radius-lg
 *  - 阴影类：--shadow-{elevation}，如 --shadow-raised-100
 *  - 字号类：--text-{step}，如 --text-12 / --text-14
 *  - 动效类：--{param}，如 --ease-out / --duration-fast
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\theme-schema.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 主题类别枚举——防止把形状 token 写进颜色字段。
 */
export const TokenCategory = {
  ANIMATION: 'animation',
  COLOR: 'color',
  SHADOW: 'shadow',
  SIZE: 'size',
  TYPOGRAPHY: 'typography',
} as const;

/** 主题类别 */
export type TokenCategoryType =
  (typeof TokenCategory)[keyof typeof TokenCategory];

/**
 * 单个 token 的元数据描述。
 */
export interface TokenDefinition {
  /** CSS 变量名（不含 -- 前缀） */
  readonly cssVar: string;
  /** 所属类别 */
  readonly category: TokenCategoryType;
  /** 人类可读描述 */
  readonly description: string;
  /** 默认值（light 主题） */
  readonly defaultValue: string;
  /** 暗夜模式下的值（可选；不定义则 fallback 到 defaultValue） */
  readonly darkValue?: string;
  /** 示例用途（用于文档生成） */
  readonly example?: string;
}

/** 主题 token 完整注册表：cssVar → TokenDefinition */
export const themeTokens = {
  // ===== 颜色：语义色 =====
  primary: {
    category: TokenCategory.COLOR,
    cssVar: 'primary',
    defaultValue: '222.2 47.4% 11.2%',
    description: '主题主色：主按钮、主链接、关键操作点',
  },
  'primary-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'primary-foreground',
    defaultValue: '210 40% 98%',
    description: '前景色（在 primary 背景上的文本）',
  },
  'primary-hover': {
    category: TokenCategory.COLOR,
    cssVar: 'primary-hover',
    defaultValue: '217.2 32.6% 17.5%',
    description: '主色 hover 态背景',
  },
  secondary: {
    category: TokenCategory.COLOR,
    cssVar: 'secondary',
    defaultValue: '210 40% 96.1%',
    description: '次级背景：卡片、嵌套容器',
  },
  'secondary-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'secondary-foreground',
    defaultValue: '222.2 47.4% 11.2%',
    description: '次级前景色',
  },
  accent: {
    category: TokenCategory.COLOR,
    cssVar: 'accent',
    defaultValue: '210 40% 96.1%',
    description: '强调色：hover 行、选中态',
  },
  'accent-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'accent-foreground',
    defaultValue: '222.2 47.4% 11.2%',
    description: '强调色上的前景色',
  },
  destructive: {
    category: TokenCategory.COLOR,
    cssVar: 'destructive',
    defaultValue: '0 84.2% 60.2%',
    description: '危险操作：删除、错误态',
  },
  'destructive-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'destructive-foreground',
    defaultValue: '210 40% 98%',
    description: '危险色上的前景色',
  },

  // ===== 颜色：中性色 =====
  background: {
    category: TokenCategory.COLOR,
    cssVar: 'background',
    defaultValue: '0 0% 100%',
    darkValue: '222.2 84% 4.9%',
    description: '页面背景色',
  },
  foreground: {
    category: TokenCategory.COLOR,
    cssVar: 'foreground',
    defaultValue: '222.2 84% 4.9%',
    darkValue: '210 40% 98%',
    description: '默认前景色（正文）',
  },
  muted: {
    category: TokenCategory.COLOR,
    cssVar: 'muted',
    defaultValue: '210 40% 96.1%',
    description: '弱化背景：禁用态、表头背景',
  },
  'muted-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'muted-foreground',
    defaultValue: '215.4 16.3% 46.9%',
    description: '弱化文本色：副标题、提示',
  },
  card: {
    category: TokenCategory.COLOR,
    cssVar: 'card',
    defaultValue: '0 0% 100%',
    description: '卡片背景',
  },
  'card-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'card-foreground',
    defaultValue: '222.2 84% 4.9%',
    description: '卡片文本色',
  },
  popover: {
    category: TokenCategory.COLOR,
    cssVar: 'popover',
    defaultValue: '0 0% 100%',
    description: '浮层背景',
  },
  'popover-foreground': {
    category: TokenCategory.COLOR,
    cssVar: 'popover-foreground',
    defaultValue: '222.2 84% 4.9%',
    description: '浮层文本色',
  },
  border: {
    category: TokenCategory.COLOR,
    cssVar: 'border',
    defaultValue: '214.3 31.8% 91.4%',
    description: '边框色',
  },
  input: {
    category: TokenCategory.COLOR,
    cssVar: 'input',
    defaultValue: '214.3 31.8% 91.4%',
    description: '输入框边框色',
  },
  ring: {
    category: TokenCategory.COLOR,
    cssVar: 'ring',
    defaultValue: '222.2 84% 4.9%',
    description: 'focus ring 色',
  },

  // ===== 圆角系统 =====
  radius: {
    category: TokenCategory.SIZE,
    cssVar: 'radius',
    defaultValue: '0.5rem',
    description: '基础圆角（按钮、卡片、弹窗统一）',
  },
  'radius-sm': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-sm',
    defaultValue: 'calc(0.5rem - 4px)',
    description: '小圆角：标签、小按钮',
  },
  'radius-md': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-md',
    defaultValue: 'calc(0.5rem - 2px)',
    description: '中圆角：下拉项、嵌套卡片',
  },
  'radius-lg': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-lg',
    defaultValue: '0.5rem',
    description: '大圆角：浮层面板',
  },
  'radius-xl': {
    category: TokenCategory.SIZE,
    cssVar: 'radius-xl',
    defaultValue: 'calc(0.5rem + 4px)',
    description: '特大圆角：模态弹窗',
  },

  // ===== 阴影系统 =====
  'shadow-raised-100': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-100',
    defaultValue: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    description: '层级 1：悬浮卡片、下拉框',
  },
  'shadow-raised-200': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-200',
    defaultValue:
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    description: '层级 2：模态弹窗',
  },
  'shadow-raised-300': {
    category: TokenCategory.SHADOW,
    cssVar: 'shadow-raised-300',
    defaultValue:
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    description: '层级 3：抽屉、重型浮层',
  },

  // ===== 字号系统 =====
  'text-10': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-10',
    defaultValue: '0.625rem',
    description: '10px：标签脚注',
  },
  'text-12': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-12',
    defaultValue: '0.75rem',
    description: '12px：辅助文字',
  },
  'text-14': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-14',
    defaultValue: '0.875rem',
    description: '14px：默认正文',
  },
  'text-16': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'text-16',
    defaultValue: '1rem',
    description: '16px：次级标题',
  },
  'h2-size': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'h2-size',
    defaultValue: '1.5rem',
    description: 'h2 标题字号',
  },
  'h3-size': {
    category: TokenCategory.TYPOGRAPHY,
    cssVar: 'h3-size',
    defaultValue: '1.25rem',
    description: 'h3 标题字号',
  },

  // ===== 动效系统 =====
  'ease-default': {
    category: TokenCategory.ANIMATION,
    cssVar: 'ease-default',
    defaultValue: 'cubic-bezier(0.2, 0, 0, 1)',
    description: '标准进出动画缓动',
  },
  'ease-spring': {
    category: TokenCategory.ANIMATION,
    cssVar: 'ease-spring',
    defaultValue: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    description: '弹性缓动：弹窗缩放、抽屉推出',
  },
  'duration-fast': {
    category: TokenCategory.ANIMATION,
    cssVar: 'duration-fast',
    defaultValue: '150ms',
    description: '快过渡：按钮 hover、颜色切换',
  },
  'duration-default': {
    category: TokenCategory.ANIMATION,
    cssVar: 'duration-default',
    defaultValue: '200ms',
    description: '默认过渡：展开/收起、浮层淡入淡出',
  },
} as const satisfies Record<string, TokenDefinition>;

/** Token 名称类型（所有注册过的 token cssVar 的并集） */
export type TokenName = keyof typeof themeTokens;

/**
 * 按类别分组后的 token 映射，便于文档面板按 Tab 筛选。
 */
export const tokensByCategory = {
  animation: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.ANIMATION,
    ),
  ) as Record<string, TokenDefinition>,
  color: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.COLOR,
    ),
  ) as Record<string, TokenDefinition>,
  shadow: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.SHADOW,
    ),
  ) as Record<string, TokenDefinition>,
  size: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.SIZE,
    ),
  ) as Record<string, TokenDefinition>,
  typography: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.TYPOGRAPHY,
    ),
  ) as Record<string, TokenDefinition>,
};
