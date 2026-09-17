// @data-file 纯数据定义，无业务逻辑
/**
 * base 层原始色阶 token —— 设计侧维护的原始色阶（primary / neutral 50-950）。
 *
 * 色阶取值依据：以现行 --primary（HSL 222.2 47.4% 11.2%，深海军蓝，对应 950 档）
 * 的色相/饱和度为锚点推导；neutral 色阶共用同色相、饱和度降至 14% 贴近现行
 * border / muted 的观感。base 层不直接被组件引用，只作为 semantic 层取值来源，
 * dark 切换发生在 semantic 层，因此本层一律不声明 darkValue。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\theme\tokens-base.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { TokenDefinition } from './theme-schema';

/**
 * base 层 token 注册表：cssVar → TokenDefinition。
 *
 * @remarks 值为 HSL 通道三元组（不含 hsl() 包装），与 semantic 层颜色 token 的存储格式一致。
 */
export const baseTokens = {
  // ===== primary 色阶（设计侧维护的原始色阶） =====
  'yd-color-primary-50': {
    category: 'color',
    cssVar: 'yd-color-primary-50',
    defaultValue: '222.2 47.4% 97.5%',
    description: '主色色阶 50：最浅主色底，hover 浅背景等场景的取值来源',
    layer: 'base',
  },
  'yd-color-primary-100': {
    category: 'color',
    cssVar: 'yd-color-primary-100',
    defaultValue: '222.2 47.4% 93.5%',
    description: '主色色阶 100：浅主色底',
    layer: 'base',
  },
  'yd-color-primary-200': {
    category: 'color',
    cssVar: 'yd-color-primary-200',
    defaultValue: '222.2 47.4% 86%',
    description: '主色色阶 200：浅主色底、主色边框浅档',
    layer: 'base',
  },
  'yd-color-primary-300': {
    category: 'color',
    cssVar: 'yd-color-primary-300',
    defaultValue: '222.2 47.4% 77%',
    description: '主色色阶 300：禁用态主色、装饰性主色块',
    layer: 'base',
  },
  'yd-color-primary-400': {
    category: 'color',
    cssVar: 'yd-color-primary-400',
    defaultValue: '222.2 47.4% 64%',
    description: '主色色阶 400：弱主色文本、图表次序列',
    layer: 'base',
  },
  'yd-color-primary-500': {
    category: 'color',
    cssVar: 'yd-color-primary-500',
    defaultValue: '222.2 47.4% 52%',
    description: '主色色阶 500：基准主色，品牌色换肤时的首选替换点',
    layer: 'base',
  },
  'yd-color-primary-600': {
    category: 'color',
    cssVar: 'yd-color-primary-600',
    defaultValue: '222.2 47.4% 42%',
    description: '主色色阶 600：常规可交互主色',
    layer: 'base',
  },
  'yd-color-primary-700': {
    category: 'color',
    cssVar: 'yd-color-primary-700',
    defaultValue: '222.2 47.4% 33%',
    description: '主色色阶 700：深主色，hover 加深档',
    layer: 'base',
  },
  'yd-color-primary-800': {
    category: 'color',
    cssVar: 'yd-color-primary-800',
    defaultValue: '222.2 47.4% 24%',
    description: '主色色阶 800：重主色背景',
    layer: 'base',
  },
  'yd-color-primary-900': {
    category: 'color',
    cssVar: 'yd-color-primary-900',
    defaultValue: '222.2 47.4% 17%',
    description: '主色色阶 900：极深主色',
    layer: 'base',
  },
  'yd-color-primary-950': {
    category: 'color',
    cssVar: 'yd-color-primary-950',
    defaultValue: '222.2 47.4% 11.2%',
    description: '主色色阶 950：最深主色，与现行 --primary 值对齐',
    layer: 'base',
  },

  // ===== neutral 色阶（设计侧维护的原始色阶） =====
  'yd-color-neutral-50': {
    category: 'color',
    cssVar: 'yd-color-neutral-50',
    defaultValue: '222.2 14% 97%',
    description: '中性色阶 50：页面浅底、分割留白',
    layer: 'base',
  },
  'yd-color-neutral-100': {
    category: 'color',
    cssVar: 'yd-color-neutral-100',
    defaultValue: '222.2 14% 93%',
    description: '中性色阶 100：弱化背景浅档',
    layer: 'base',
  },
  'yd-color-neutral-200': {
    category: 'color',
    cssVar: 'yd-color-neutral-200',
    defaultValue: '222.2 14% 86%',
    description: '中性色阶 200：浅边框、禁用底色',
    layer: 'base',
  },
  'yd-color-neutral-300': {
    category: 'color',
    cssVar: 'yd-color-neutral-300',
    defaultValue: '222.2 14% 78%',
    description: '中性色阶 300：常规边框、占位线',
    layer: 'base',
  },
  'yd-color-neutral-400': {
    category: 'color',
    cssVar: 'yd-color-neutral-400',
    defaultValue: '222.2 14% 64%',
    description: '中性色阶 400：占位文本、图标弱化档',
    layer: 'base',
  },
  'yd-color-neutral-500': {
    category: 'color',
    cssVar: 'yd-color-neutral-500',
    defaultValue: '222.2 14% 46%',
    description: '中性色阶 500：基准中性文本',
    layer: 'base',
  },
  'yd-color-neutral-600': {
    category: 'color',
    cssVar: 'yd-color-neutral-600',
    defaultValue: '222.2 14% 38%',
    description: '中性色阶 600：次级文本',
    layer: 'base',
  },
  'yd-color-neutral-700': {
    category: 'color',
    cssVar: 'yd-color-neutral-700',
    defaultValue: '222.2 14% 30%',
    description: '中性色阶 700：深次级文本',
    layer: 'base',
  },
  'yd-color-neutral-800': {
    category: 'color',
    cssVar: 'yd-color-neutral-800',
    defaultValue: '222.2 14% 22%',
    description: '中性色阶 800：重文本、暗底浅元素',
    layer: 'base',
  },
  'yd-color-neutral-900': {
    category: 'color',
    cssVar: 'yd-color-neutral-900',
    defaultValue: '222.2 14% 15%',
    description: '中性色阶 900：极深中性色',
    layer: 'base',
  },
  'yd-color-neutral-950': {
    category: 'color',
    cssVar: 'yd-color-neutral-950',
    defaultValue: '222.2 14% 10%',
    description: '中性色阶 950：最深中性色，暗色页面底',
    layer: 'base',
  },
} as const satisfies Record<string, TokenDefinition>;

/** base 层 token 名并集 */
export type BaseTokenName = keyof typeof baseTokens;
