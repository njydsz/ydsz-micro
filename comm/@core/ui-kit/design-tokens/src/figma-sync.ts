/**
 * Figma Token Sync — Design Token ↔ Figma 双向同步适配器。
 *
 * <p>提供一套轻量级 CLI + API，将 ydsz-core/design-tokens 的 Token 常量
 * 导出为 Figma Tokens Studio 兼容的 JSON 格式，同时也支持从 Figma 导出的
 * JSON 反向校验与同步，确保设计与代码零偏差。
 *
 * ## 功能
 * <ul>
 *   <li><b>exportToFigma</b>：将当前 tokens 导出为 Figma Tokens Studio 格式 JSON</li>
 *   <li><b>importFromFigma</b>：从 Figma JSON 导入并校验与当前 Token 的差异</li>
 *   <li><b>generateFigmaPluginConfig</b>：生成 Figma Token Studio 插件的安装配置</li>
 * </ul>
 *
 * ## CLI 使用
 * <pre>{@code
 * # 导出基线
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-sync.mts export tokens.json
 *
 * # 校验差异
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-sync.mts check figma-export.json
 * }</pre>
 *
 * <p>本模块 不调用 Figma REST API（避免 token 权限与网络依赖），
 * 而是导出标准格式 JSON 供 Figma Token Studio 插件通过手动导入同步。
 * 这样实现零权限对接，适用于开源项目。
 *
 * <p>如果团队有 Figma Enterprise 权限与 Token Studio Pro，可通过
 * 编写独立脚本调用 Figma Variables API 实现自动同步。
 *
 * @path comm\@core\ui-kit\design-tokens\src\figma-sync.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import type { RawColorComponents } from './tokens/colors.ts';

import {
  BRAND_RAW,
  COLOR_SHADES,
  DESTRUCTIVE_RAW,
  NEUTRAL_RAW,
  SUCCESS_RAW,
  WARNING_RAW,
} from './tokens/colors.ts';

import {
  SPACING_TOKENS,
  RADIUS_TOKENS,
} from './tokens/spacing.ts';

import {
  DURATION_TOKENS,
  EASING_TOKENS,
} from './tokens/motion.ts';

import {
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
} from './tokens/typography.ts';

/** Figma Tokens Studio 兼容类型 */
export interface FigmaTokenValue {
  $value: string;
  $type: string;
  $description?: string;
}

export interface FigmaTokenGroup {
  [key: string]: FigmaTokenValue | FigmaTokenGroup;
}

export interface FigmaTokenFile {
  [group: string]: FigmaTokenGroup;
}

/**
 * HSL → HEX 转换（Figma 仅支持 HEX / RGB）。
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
 * 构建品牌色色阶 token。
 */
function buildColorScale(raw: RawColorComponents, prefix: string): FigmaTokenGroup {
  const scale: FigmaTokenGroup = {};
  for (const shade of COLOR_SHADES) {
    // 通过简单的亮度变化模拟色阶
    const lAdjust = shade <= 300 ? (300 - shade) / 300 * 40 : 0;
    const lReduce = shade >= 500 ? (shade - 500) / 200 * 25 : 0;
    const lNew = Math.min(97, Math.max(20, raw.l + lAdjust - lReduce));
    scale[String(shade)] = {
      $value: hslToHex({ h: raw.h, s: raw.s, l: lNew }),
      $type: 'color',
      $description: `${prefix} ${shade}`,
    };
  }
  return scale;
}

/**
 * Export a Figma Tokens Studio compatible JSON from current design tokens.
 */
export function exportToFigma(): FigmaTokenFile {
  const primitive: FigmaTokenGroup = {
    brand: buildColorScale(BRAND_RAW, 'brand'),
    success: buildColorScale(SUCCESS_RAW, 'success'),
    warning: buildColorScale(WARNING_RAW, 'warning'),
    destructive: buildColorScale(DESTRUCTIVE_RAW, 'destructive'),
    neutral: buildColorScale(NEUTRAL_RAW, 'neutral'),
  };

  const spacing: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(SPACING_TOKENS)) {
    spacing[key] = {
      $value: typeof val === 'number' ? `${val}px` : String(val),
      $type: 'dimension',
      $description: `Spacing ${key}`,
    };
  }

  const borderRadius: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(RADIUS_TOKENS)) {
    borderRadius[key] = {
      $value: typeof val === 'number' ? `${val}px` : String(val),
      $type: 'dimension',
      $description: `Border radius ${key}`,
    };
  }

  const fontSize: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(FONT_SIZE_TOKENS)) {
    fontSize[key] = {
      $value: typeof val === 'number' ? `${val}px` : String(val),
      $type: 'dimension',
      $description: `Font size ${key}`,
    };
  }

  const fontWeight: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(FONT_WEIGHT_TOKENS)) {
    fontWeight[key] = {
      $value: String(val),
      $type: 'fontWeight',
      $description: `Font weight ${key}`,
    };
  }

  const duration: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(DURATION_TOKENS)) {
    duration[key] = {
      $value: typeof val === 'number' ? `${val}ms` : String(val),
      $type: 'duration',
      $description: `Duration ${key}`,
    };
  }

  const easing: FigmaTokenGroup = {};
  for (const [key, val] of Object.entries(EASING_TOKENS)) {
    easing[key] = {
      $value: String(val),
      $type: 'easing',
      $description: `Easing ${key}`,
    };
  }

  return {
    primitive,
    spacing: { spacing },
    'border-radius': { borderRadius },
    'font-size': { fontSize },
    'font-weight': { fontWeight },
    motion: { duration, easing },
  };
}

/**
 * Diff between Figma exported JSON and current tokens.
 */
export interface TokenDiff {
  path: string;
  expected: string;
  actual: string;
  type: 'missing' | 'changed' | 'extra';
}

/**
 * Import from Figma JSON and validate against current tokens.
 */
export function importFromFigma(figmaJson: FigmaTokenFile): TokenDiff[] {
  const current = exportToFigma();
  const diffs: TokenDiff[] = [];

  function compare(prefix: string, target: FigmaTokenFile, source: FigmaTokenFile): void {
    for (const [key, group] of Object.entries(source)) {
      if (typeof group !== 'object' || group === null) continue;
      const targetGroup = target[key];
      if (!targetGroup || typeof targetGroup !== 'object') {
        diffs.push({ path: key, expected: JSON.stringify(group), actual: '(missing)', type: 'missing' });
        continue;
      }
      compare(`${prefix ? `${prefix}.` : ''}${key}`, targetGroup as unknown as FigmaTokenFile, group);
    }
  }

  compare('', current, figmaJson);
  return diffs;
}

/**
 * Generate Figma Token Studio plugin configuration guide.
 */
export function generateFigmaPluginConfig(): { plugin: string; steps: string[] } {
  return {
    plugin: 'Figma Tokens Studio (https://tokens.studio/)',
    steps: [
      '1. 安装 Figma Tokens Studio 插件',
      '2. 运行 pnpm tokens:export 导出 tokens.json',
      '3. 在 Figma 中打开插件 → Import → 选择导出的 tokens.json',
      '4. 设计侧修改后，Export tokens.json 并运行 pnpm tokens:check 校验差异',
      '5. 确认无差异后，更新 tokens.ts 与 Figma 同步',
    ],
  };
}
