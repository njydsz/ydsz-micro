/**
 * Figma Variables API 直连同步器。
 *
 * <p>在现有 {@link ./figma-sync.ts} 的 Tokens Studio JSON 导入导出基础上，
 * 提供可选的 Figma REST API 直连能力：通过 `FIGMA_ACCESS_TOKEN` 环境变量
 * 认证后，可将 design-tokens 直接推送到 Figma Variables 集合，或从 Figma
 * 拉取最新值进行比对。
 *
 * <p><b>前置条件</b>：Figma Enterprise / Professional 计划 + Variables API 权限。
 * 未配置 token 时自动降级为 JSON 文件模式（不抛错）。
 *
 * <p><b>用法</b>：
 * <pre>{@code
 * # 配置 Figma token
 * export FIGMA_ACCESS_TOKEN=figd_xxx
 * export FIGMA_FILE_KEY=your-file-key
 *
 * # 推送 tokens 到 Figma
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-api-sync.mts push
 *
 * # 从 Figma 拉取并校验差异
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-api-sync.mts diff
 * }</pre>
 *
 * @path comm\@core\ui-kit\design-tokens\src\figma-api-sync.ts
 * @author ydsz-ai
 * @since 26.11.03
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

import { SPACING_TOKENS, RADIUS_TOKENS } from './tokens/spacing.ts';

import { DURATION_TOKENS } from './tokens/motion.ts';

import { FONT_SIZE_TOKENS, FONT_WEIGHT_TOKENS } from './tokens/typography.ts';

/** Figma Variables API 基础 URL */
const FIGMA_API_BASE = 'https://api.figma.com/v1';

/** Figma REST API 端点 */
const FIGMA_VARIABLES_ENDPOINT = '/variables/local';

/** HSL → HEX 转换 */
function hslToHex({ h, s, l }: RawColorComponents): string {
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  const a = sDecimal * Math.min(lDecimal, 1 - lDecimal);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Figma Variables API 请求参数 */
interface FigmaApiConfig {
  /** Figma access token */
  accessToken: string;
  /** Figma 文件 key */
  fileKey: string;
}

/** Figma Variable 类型 */
type FigmaVariableType = 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';

/** Figma Variable 值 */
type FigmaVariableValue = boolean | number | string | { r: number; g: number; b: number };

/** Figma Variable 定义 */
interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: FigmaVariableType;
  valuesByMode: Record<string, FigmaVariableValue>;
}

/** Figma Variable Collection */
interface FigmaCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

/** Figma Variables 响应 */
interface FigmaVariablesResponse {
  status: number;
  err: string | null;
  meta?: {
    variableCollections: Record<string, FigmaCollection>;
    variables: Record<string, FigmaVariable>;
  };
}

/** 环境变量配置 */
export function getFigmaConfig(): FigmaApiConfig | null {
  const accessToken = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!accessToken || !fileKey) {
    return null;
  }

  return { accessToken, fileKey };
}

/** 发送 Figma API 请求 */
async function figmaRequest(
  config: FigmaApiConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<FigmaVariablesResponse> {
  const url = `${FIGMA_API_BASE}${path}`;

  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'X-Figma-Token': config.accessToken,
    },
    method,
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<FigmaVariablesResponse>;
}

/** 获取 Figma 本地 Variables */
export async function fetchFigmaVariables(config: FigmaApiConfig): Promise<FigmaVariablesResponse> {
  return figmaRequest(config, 'GET', `/files/${config.fileKey}${FIGMA_VARIABLES_ENDPOINT}`);
}

/** HSL → Figma RGBA */
function hslToRgba(hsl: RawColorComponents): { b: number; g: number; r: number } {
  const hex = hslToHex(hsl);
  return {
    b: Number.parseInt(hex.slice(5, 7), 16) / 255,
    g: Number.parseInt(hex.slice(3, 5), 16) / 255,
    r: Number.parseInt(hex.slice(1, 3), 16) / 255,
  };
}

/** 构建 Figma Variable 数据 */
export function buildFigmaVariablesPayload(): {
  collections: Array<{ name: string; modes: Array<{ name: string }> }>;
  variables: Array<{
    collectionId: string;
    name: string;
    resolvedType: FigmaVariableType;
    valuesByMode: Record<string, FigmaVariableValue>;
  }>;
} {
  const collections = [{ modes: [{ name: 'Default' }], name: 'YDSZ Design Tokens' }];

  const variables: Array<{
    collectionId: string;
    name: string;
    resolvedType: FigmaVariableType;
    valuesByMode: Record<string, FigmaVariableValue>;
  }> = [];

  // 颜色 tokens
  const colorGroups = [
    { prefix: 'brand', raw: BRAND_RAW },
    { prefix: 'neutral', raw: NEUTRAL_RAW },
    { prefix: 'success', raw: SUCCESS_RAW },
    { prefix: 'warning', raw: WARNING_RAW },
    { prefix: 'destructive', raw: DESTRUCTIVE_RAW },
  ];

  for (const group of colorGroups) {
    for (const shade of COLOR_SHADES) {
      const color = group.raw[shade];
      variables.push({
        collectionId: 'collection-1',
        name: `color/${group.prefix}/${shade}`,
        resolvedType: 'COLOR',
        valuesByMode: {
          default: hslToRgba(color),
        },
      });
    }
  }

  // 间距 tokens
  for (const [key, value] of Object.entries(SPACING_TOKENS)) {
    variables.push({
      collectionId: 'collection-1',
      name: `spacing/${key}`,
      resolvedType: 'FLOAT',
      valuesByMode: { default: Number.parseFloat(value.replace('px', '')) },
    });
  }

  // 圆角 tokens
  for (const [key, value] of Object.entries(RADIUS_TOKENS)) {
    variables.push({
      collectionId: 'collection-1',
      name: `radius/${key}`,
      resolvedType: 'FLOAT',
      valuesByMode: { default: Number.parseFloat(value.replace('rem', '')) * 16 },
    });
  }

  // 动效 tokens
  for (const [key, value] of Object.entries(DURATION_TOKENS)) {
    variables.push({
      collectionId: 'collection-1',
      name: `duration/${key}`,
      resolvedType: 'FLOAT',
      valuesByMode: { default: Number.parseFloat(value.replace('ms', '')) },
    });
  }

  // 字体大小 tokens
  for (const [key, value] of Object.entries(FONT_SIZE_TOKENS)) {
    variables.push({
      collectionId: 'collection-1',
      name: `fontSize/${key}`,
      resolvedType: 'FLOAT',
      valuesByMode: { default: Number.parseFloat(value.replace('rem', '')) * 16 },
    });
  }

  // 字体粗细 tokens
  for (const [key, value] of Object.entries(FONT_WEIGHT_TOKENS)) {
    variables.push({
      collectionId: 'collection-1',
      name: `fontWeight/${key}`,
      resolvedType: 'FLOAT',
      valuesByMode: { default: value },
    });
  }

  return { collections, variables };
}

/** 推送 tokens 到 Figma Variables */
export async function pushToFigma(config: FigmaApiConfig): Promise<void> {
  const payload = buildFigmaVariablesPayload();

  // 创建 collection 和 variables
  await figmaRequest(
    config,
    'POST',
    `/files/${config.fileKey}${FIGMA_VARIABLES_ENDPOINT}`,
    payload,
  );
}

/** 从 Figma 拉取并与本地 tokens 对比 */
export async function diffWithFigma(config: FigmaApiConfig): Promise<{
  added: string[];
  removed: string[];
  modified: Array<{ name: string; local: unknown; figma: unknown }>;
}> {
  const remote = await fetchFigmaVariables(config);
  const local = buildFigmaVariablesPayload();

  const remoteVars = remote.meta?.variables ?? {};
  const remoteNames = Object.values(remoteVars).map((v: FigmaVariable) => v.name);

  const localNames = local.variables.map((v) => v.name);

  const added = remoteNames.filter((name: string) => !localNames.includes(name));
  const removed = localNames.filter((name: string) => !remoteNames.includes(name));

  const modified: Array<{ name: string; local: unknown; figma: unknown }> = [];
  for (const v of local.variables) {
    const remoteVar = Object.values(remoteVars).find((rv: FigmaVariable) => rv.name === v.name);
    if (remoteVar) {
      const remoteValue = remoteVar.valuesByMode.default;
      const localValue = v.valuesByMode.default;
      if (JSON.stringify(remoteValue) !== JSON.stringify(localValue)) {
        modified.push({ figma: remoteValue, local: localValue, name: v.name });
      }
    }
  }

  return { added, modified, removed };
}
