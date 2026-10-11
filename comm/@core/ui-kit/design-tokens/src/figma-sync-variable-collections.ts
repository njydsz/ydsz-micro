/**
 * Figma Variable Collections 生成器 —— 输出符合 Figma Variables API 的
 * multi-collection JSON 结构（Primitive / Semantic / Component 三级）。
 *
 * <p>与 PrimeVue PrimeOne 4.0 的多层 Design Token 体系对齐。
 *
 * <p>输出结构:
 * <pre>{@code
 * {
 *   "variableCollections": [{
 *     "name": "Primitive",
 *     "modes": [{ "name": "Default", "variables": [...] }],
 *   },{
 *     "name": "Semantic",
 *     "modes": [{ "name": "Light", "variables": [...] }, { "name": "Dark", "variables": [...] }],
 *   },{
 *     "name": "Component",
 *     "modes": [{ "name": "Default", "variables": [...] }],
 *   }]
 * }
 * }</pre>
 *
 * <p>可直接写入 dist/tokens/figma-variable-collections.json，
 * 由 Figma Variables REST API (v1/files/{file_id}/variables) 推送。
 *
 * @path comm\@core\ui-kit\design-tokens\src\figma-sync-variable-collections.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import type { RawColorComponents, SemanticRole } from './tokens/colors.ts';

import {
  COLOR_SHADES,
  NEUTRAL_RAW,
  SEMANTIC_RAW_MAP,
} from './tokens/colors.ts';

import { SPACING_TOKENS, RADIUS_TOKENS } from './tokens/spacing.ts';
import { SHADOW_PRESETS } from './tokens/shadow.ts';
import { FONT_SIZE_TOKENS, FONT_WEIGHT_TOKENS } from './tokens/typography.ts';
import { DURATION_TOKENS, EASING_TOKENS } from './tokens/motion.ts';

// ======================== 类型定义 ========================

/** Figma API Variable 值类型 */
type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/** Figma Variable 值 */
interface FigmaVariableValue {
  type?: string;
  value?: string | number;
  resolvedType?: FigmaVariableType;
  /** 引用另一个变量 ID（alias） */
  alias?: string;
}

/** Figma Variable */
interface FigmaVariable {
  id?: string;
  name: string;
  resolvedType: FigmaVariableType;
  valuesByMode: Record<string, FigmaVariableValue>;
  description?: string;
}

/** Figma Variable Collection Mode */
interface FigmaMode {
  name: string;
  modeId?: string;
}

/** Figma Variable Collection */
interface FigmaVariableCollection {
  name: string;
  id?: string;
  modes: FigmaMode[];
  variables: FigmaVariable[];
}

/** 最终输出结构 */
export interface FigmaVariableCollectionsOutput {
  variableCollections: FigmaVariableCollection[];
}

// ======================== 工具函数 ========================

/**
 * HSL → HEX 转换。
 */
function hslToHex({ h, s, l }: RawColorComponents): string {
  const sFrac = s / 100;
  const lFrac = l / 100;
  const a = sFrac * Math.min(lFrac, 1 - lFrac);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = lFrac - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * 构建色阶变量配置。
 *
 * @param raw 原始 HSL 分量
 * @param role 语义角色名
 * @return 变量数组（每个色阶一个）
 */
function buildColorScaleVariables(raw: RawColorComponents, role: SemanticRole): FigmaVariable[] {
  const variables: FigmaVariable[] = [];
  for (const shade of COLOR_SHADES) {
    const lAdjust = shade <= 300 ? (300 - shade) / 300 * 40 : 0;
    const lReduce = shade >= 500 ? (shade - 500) / 200 * 25 : 0;
    const lNew = Math.min(97, Math.max(20, raw.l + lAdjust - lReduce));
    variables.push({
      name: `color/${role}/${shade}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        Default: { type: 'color', value: hslToHex({ h: raw.h, s: raw.s, l: lNew }) },
      },
      description: `${role.charAt(0).toUpperCase() + role.slice(1)} color shade ${shade}`,
    });
  }
  return variables;
}

/**
 * 从 Token Record 构建间距/字号/字重变量。
 */
function buildDimensionVariables(
  tokens: Record<string, string | number>,
  prefix: string,
  resolvedType: FigmaVariableType,
): FigmaVariable[] {
  const variables: FigmaVariable[] = [];
  for (const [key, val] of Object.entries(tokens)) {
    const numValue = typeof val === 'number' ? val : parseFloat(val);
    variables.push({
      name: `${prefix}/${key}`,
      resolvedType,
      valuesByMode: {
        Default: resolvedType === 'FLOAT'
          ? { type: 'float', value: numValue }
          : { type: 'string', value: String(val) },
      },
      description: `${prefix} ${key}`,
    });
  }
  return variables;
}

// ======================== Collection 构建器 ========================

/**
 * Primitive Collection —— 原始物理值。
 *
 * <p>包含品牌/语义色色阶 (HEX)、间距 (px)、圆角 (px)、
 * 字号 (rem)、字重、动效时长与缓动。
 */
function buildPrimitiveCollection(): FigmaVariableCollection {
  const variables: FigmaVariable[] = [];

  // 1. 色阶
  const roles: SemanticRole[] = ['brand', 'success', 'warning', 'destructive', 'neutral'];
  for (const role of roles) {
    variables.push(...buildColorScaleVariables(SEMANTIC_RAW_MAP[role], role));
  }

  // 2. 间距
  variables.push(...buildDimensionVariables(SPACING_TOKENS, 'spacing', 'FLOAT'));

  // 3. 圆角
  variables.push(...buildDimensionVariables(RADIUS_TOKENS, 'radius', 'FLOAT'));

  // 4. 字号
  variables.push(...buildDimensionVariables(FONT_SIZE_TOKENS, 'fontSize', 'STRING'));

  // 5. 字重
  variables.push(...buildDimensionVariables(FONT_WEIGHT_TOKENS, 'fontWeight', 'STRING'));

  // 6. 动效时长
  variables.push(...buildDimensionVariables(DURATION_TOKENS, 'duration', 'FLOAT'));

  // 7. 缓动曲线（字符串类型）
  for (const [key, val] of Object.entries(EASING_TOKENS)) {
    variables.push({
      name: `easing/${key}`,
      resolvedType: 'STRING',
      valuesByMode: { Default: { type: 'string', value: val } },
      description: `Easing curve ${key}`,
    });
  }

  // 8. 阴影预设（字符串类型）
  for (const [key, val] of Object.entries(SHADOW_PRESETS)) {
    variables.push({
      name: `shadow/${key}`,
      resolvedType: 'STRING',
      valuesByMode: { Default: { type: 'string', value: val } },
      description: `Shadow preset ${key}`,
    });
  }

  return {
    name: 'Primitive',
    modes: [{ name: 'Default' }],
    variables,
  };
}

/**
 * Semantic Collection —— 语义名映射（Light / Dark 两模式）。
 *
 * <p>每变量在 Light 和 Dark 模式下分别引用 Primitive 色阶或提供独立 HSL。
 */
function buildSemanticCollection(): FigmaVariableCollection {
  const variables: FigmaVariable[] = [];

  // Surface 语义层 —— Light: neutral-50/100/200；Dark: 反转后 neutral-50/100/200
  const surfaceShades = [
    { level: '1', lightL: 98, lightKey: 'neutral/50', darkL: 14, darkKey: 'neutral/50' },
    { level: '2', lightL: 95, lightKey: 'neutral/100', darkL: 18, darkKey: 'neutral/100' },
    { level: '3', lightL: 90, lightKey: 'neutral/200', darkL: 24, darkKey: 'neutral/200' },
  ];

  for (const s of surfaceShades) {
    variables.push({
      name: `surface/${s.level}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        Light: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: s.lightL }) },
        Dark: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: s.darkL }) },
      },
      description: `Surface background level ${s.level}`,
    });
  }

  // Text 语义层 —— primary / secondary / tertiary / disabled / inverse
  const textDefs = [
    { role: 'primary', lightL: 20, darkL: 88, neutralKey: '700' },
    { role: 'secondary', lightL: 44, darkL: 62, neutralKey: '500' },
    { role: 'tertiary', lightL: 60, darkL: 48, neutralKey: '400' },
    { role: 'disabled', lightL: 78, darkL: 32, neutralKey: '300' },
  ];

  for (const t of textDefs) {
    variables.push({
      name: `text/${t.role}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        Light: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: t.lightL }) },
        Dark: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: t.darkL }) },
      },
      description: `Text color ${t.role}`,
    });
  }

  // text/inverse —— 纯白（足够亮用于深色/浅色反转文本）
  variables.push({
    name: 'text/inverse',
    resolvedType: 'COLOR',
    valuesByMode: {
      Light: { type: 'color', value: '#FFFFFF' },
      Dark: { type: 'color', value: '#FFFFFF' },
    },
    description: 'Inverse text color (always white)',
  });

  // Border 语义层
  const borderDefs = [
    { role: 'default', lightL: 90, darkL: 24 },
    { role: 'strong', lightL: 78, darkL: 32 },
    { role: 'subtle', lightL: 95, darkL: 18 },
  ];

  for (const b of borderDefs) {
    variables.push({
      name: `border/${b.role}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        Light: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: b.lightL }) },
        Dark: { type: 'color', value: hslToHex({ h: NEUTRAL_RAW.h, s: NEUTRAL_RAW.s, l: b.darkL }) },
      },
      description: `Border color ${b.role}`,
    });
  }

  return {
    name: 'Semantic',
    modes: [{ name: 'Light' }, { name: 'Dark' }],
    variables,
  };
}

/**
 * Component Collection —— 组件级变量。
 *
 * <p>通用前缀 --ydsz-comp-*，供组件内部消费。
 */
function buildComponentCollection(): FigmaVariableCollection {
  const variables: FigmaVariable[] = [];
  const defaultMode = 'Default';

  // ---- Focus ring ----
  variables.push(
    {
      name: 'comp/focus/ringColor',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'var(--ydsz-color-brand-500)' } },
      description: 'Focus ring color (brand-500)',
    },
    {
      name: 'comp/focus/ringWidth',
      resolvedType: 'FLOAT',
      valuesByMode: { [defaultMode]: { type: 'float', value: 2 } },
      description: 'Focus ring width in px',
    },
    {
      name: 'comp/focus/ringOffset',
      resolvedType: 'FLOAT',
      valuesByMode: { [defaultMode]: { type: 'float', value: 1 } },
      description: 'Focus ring offset in px',
    },
  );

  // ---- 交互表面 ----
  variables.push(
    {
      name: 'comp/surface/hover',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-neutral-400) / 0.08)' } },
      description: 'Component hover surface',
    },
    {
      name: 'comp/surface/active',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-neutral-400) / 0.12)' } },
      description: 'Component active (pressed) surface',
    },
    {
      name: 'comp/surface/selected',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-brand-500) / 0.10)' } },
      description: 'Component selected surface',
    },
    {
      name: 'comp/surface/disabled',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'var(--ydsz-surface-2)' } },
      description: 'Component disabled surface',
    },
  );

  // ---- 组件边框 ----
  variables.push(
    {
      name: 'comp/border/hover',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'var(--ydsz-color-neutral-400)' } },
      description: 'Component hover border color',
    },
    {
      name: 'comp/border/focus',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'var(--ydsz-color-brand-500)' } },
      description: 'Component focus border color',
    },
  );

  // ---- 危险操作 ----
  variables.push(
    {
      name: 'comp/danger/bg',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-destructive-500))' } },
      description: 'Danger button background',
    },
    {
      name: 'comp/danger/bgHover',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-destructive-600))' } },
      description: 'Danger button hover background',
    },
    {
      name: 'comp/danger/bgActive',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-destructive-700))' } },
      description: 'Danger button active background',
    },
    {
      name: 'comp/danger/text',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'var(--ydsz-text-inverse)' } },
      description: 'Danger button text color',
    },
    {
      name: 'comp/danger/border',
      resolvedType: 'STRING',
      valuesByMode: { [defaultMode]: { type: 'string', value: 'hsl(var(--ydsz-color-destructive-600))' } },
      description: 'Danger button border color',
    },
  );

  return {
    name: 'Component',
    modes: [{ name: defaultMode }],
    variables,
  };
}

// ======================== 主导出函数 ========================

/**
 * 生成 Figma Variable Collections 完整 JSON。
 *
 * @return 符合 Figma Variables API 的多 collection 输出结构
 */
export function generateFigmaVariableCollections(): FigmaVariableCollectionsOutput {
  return {
    variableCollections: [
      buildPrimitiveCollection(),
      buildSemanticCollection(),
      buildComponentCollection(),
    ],
  };
}
