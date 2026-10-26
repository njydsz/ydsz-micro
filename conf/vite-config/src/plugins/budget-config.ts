/**
 * budget-config.ts — 产物体积预算：配置读取、目标匹配与体积测量（单一事实源）
 *
 * <p>构建期 `bundle-budget` 插件与 CI 期 `bash/check-size.mts` 都从本模块取配置与
 * 测量口径。历史上两者各算各的：构建期阈值 5MB/15MB、CI 期 512KB/384KB，且 CI 侧
 * 扫描的目录（dist/assets）在本仓产物布局里根本不存在，于是 CI 门禁永远"通过"。
 * 现在阈值、口径（gzip）、目录布局三件事只有一份定义。
 *
 * <p>阈值采用棘轮（ratchet）口径：`max*` 来自上一次实测（`baseline`）加头寸，
 * 目的是"今天全绿、任何回退立刻变红"，而不是一个谁都过不了、最终被逼着关掉的理想数字。
 * 架构目标值写在 `aspirationGzipKB` 里，只在报告里提示，不参与阻断。
 *
 * @path conf/vite-config/src/plugins/budget-config.ts
 * @author ydsz-team
 * @since 26.10.25
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

/** 写预算时留档的一次实测数据，用于证明阈值是棘轮而不是拍脑袋放宽 */
export interface BudgetBaseline {
  /** 实测日期（ISO） */
  measuredAt: string;
  /** 单次构建 JS+CSS 合计 gzip 体积（KB） */
  totalGzipKB: number;
  /** 单个 JS chunk 的最大 gzip 体积（KB） */
  maxChunkGzipKB: number;
  /** 单个 CSS 文件的最大 gzip 体积（KB） */
  maxCssGzipKB: number;
  /** JS 产物文件数 */
  jsFiles: number;
}

/** 单个构建目标的体积预算（gzip 口径，单位 KB） */
export interface BudgetTarget {
  /** 目标名，取应用目录名；组内兜底目标以 -default 结尾 */
  name: string;
  /** 所属范围，与仓库目录首段一致（main / apps） */
  scope: string;
  /** 构建目录（相对仓库根），如 `apps/workflow-web`；组内兜底模式的 `*` 代表同级目录名 */
  appDir: string;
  /** 单次构建总产出 gzip 体积上限（KB，JS+CSS 合计） */
  maxTotalGzipKB: number;
  /** JS 产物文件数上限 */
  maxFiles: number;
  /** 单个 JS chunk 的 gzip 体积上限（KB） */
  maxChunkGzipKB: number;
  /** 单个 CSS 文件的 gzip 体积上限（KB） */
  maxCssGzipKB: number;
  /** 留档实测值 */
  baseline?: BudgetBaseline;
  /** 架构目标总体积（KB，gzip），仅报告提示，不阻断 */
  aspirationGzipKB?: number;
}

/** 仓库级体积预算配置 */
export interface BudgetConfig {
  /** 配置版本（日期式，与规范版本号风格一致） */
  version: string;
  /** 是否按 gzip 口径计算（当前固定 true，与 nginx Brotli/Gzip 传输体积对齐） */
  gzip: boolean;
  /** 构建目标列表 */
  targets: BudgetTarget[];
}

/** 一个构建目录里 JS+CSS 产物的体积画像 */
export interface BudgetMeasure extends BudgetBaseline {
  /** 构建目录是否存在（false 说明门禁没有东西可校验） */
  exists: boolean;
}

/** 预算配置相对仓库根的路径 */
const CONFIG_RELATIVE_PATH = 'conf/budget.config.json';

/** 向上查找仓库根的最大层级（防御异常路径下的无限循环） */
const MAX_ROOT_SEARCH_DEPTH = 10;

/** 仓库根标志文件：单一工作区定义 */
const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/** 计入体积的产物扩展名（源码映射排除：不进浏览器） */
const ASSET_EXTENSIONS = ['.js', '.mjs', '.css'];

/**
 * 从起始目录向上查找仓库根。
 *
 * @param startDir 起始绝对目录
 * @returns 仓库根绝对路径；未找到时返回 null
 */
export function findRepoRoot(startDir: string): null | string {
  let current = startDir;
  for (let depth = 0; depth < MAX_ROOT_SEARCH_DEPTH; depth += 1) {
    if (existsSync(join(current, WORKSPACE_MARKER))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
  return null;
}

/**
 * 校验解析结果是否为合法的预算配置结构。
 *
 * 配置文件虽属仓库内资产，但按「外部数据必须校验」的要求做逐字段守卫：
 * 旧配置把目录写成 dist/assets（本仓产物实际在 dist/js、dist/css、dist/jse），
 * 结构不严时扫描结果为空仍会报"通过"，门禁就这么空转了。
 *
 * @param value 待校验的解析结果
 * @returns 是否为合法预算配置
 */
export function isBudgetConfig(value: unknown): value is BudgetConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { targets?: unknown };
  if (!Array.isArray(candidate.targets) || candidate.targets.length === 0) {
    return false;
  }
  return candidate.targets.every((item) => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const target = item as Record<string, unknown>;
    return (
      typeof target.name === 'string' &&
      typeof target.scope === 'string' &&
      typeof target.appDir === 'string' &&
      typeof target.maxTotalGzipKB === 'number' &&
      typeof target.maxFiles === 'number' &&
      typeof target.maxChunkGzipKB === 'number' &&
      typeof target.maxCssGzipKB === 'number'
    );
  });
}

/**
 * 读取仓库级预算配置。
 *
 * @param startDir 起始绝对目录（通常为 process.cwd()）
 * @returns 预算配置；仓库根或配置文件缺失、结构非法时返回 null
 */
export function loadBudgetConfig(startDir: string): BudgetConfig | null {
  const root = findRepoRoot(startDir);
  if (!root) {
    return null;
  }
  const configPath = join(root, CONFIG_RELATIVE_PATH);
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(configPath, 'utf8'));
    return isBudgetConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 把绝对路径归一为「相对仓库根 + 正斜杠」的目录串。
 *
 * @param root 仓库根绝对路径
 * @param absDir 待归一的绝对目录
 * @returns 相对目录串；不在仓库根之下时返回空串
 */
export function toRelativeDir(root: string, absDir: string): string {
  if (!absDir.startsWith(root)) {
    return '';
  }
  return absDir
    .slice(root.length)
    .replace(/^[\\/]/, '')
    .replaceAll('\\', '/');
}

/**
 * 构建目录是否命中 `appDir` 模式（只支持单层 `*`，与本仓实际用法一致）。
 *
 * @param pattern 配置里的 appDir，如 `apps/*`
 * @param relDir 归一后的构建目录，如 `apps/workflow-web`
 * @returns 是否命中
 */
export function matchAppDirPattern(pattern: string, relDir: string): boolean {
  if (!pattern.includes('*')) {
    return pattern === relDir;
  }
  const segments = pattern.split('/');
  const actual = relDir.split('/');
  return (
    segments.length === actual.length &&
    segments.every((segment, index) => segment === '*' || segment === actual[index])
  );
}

/**
 * 按当前构建目录匹配预算目标。
 *
 * 先取精确目录（`apps/workflow-web`），再退回组内兜底（`apps/*`）；两者都取不到时返回
 * null，由调用方决定是否阻断。新增应用会被组内兜底卡住，逼一次显式评审而不是静默无门禁。
 *
 * @param config 预算配置
 * @param cwd 当前构建目录（通常为 process.cwd()）
 * @returns 命中的预算目标；无法匹配时返回 null
 */
export function matchBudgetTarget(config: BudgetConfig, cwd: string): BudgetTarget | null {
  const root = findRepoRoot(cwd);
  if (!root) {
    return null;
  }
  const relDir = toRelativeDir(root, cwd);
  if (!relDir) {
    return null;
  }
  return (
    config.targets.find((target) => target.appDir === relDir) ??
    config.targets.find((target) => matchAppDirPattern(target.appDir, relDir)) ??
    null
  );
}

/** 预算目标展开后的一个待校验目录 */
export interface ResolvedBudgetTarget {
  /** 预算目标 */
  target: BudgetTarget;
  /** 相对仓库根的构建目录（`*` 已展开） */
  relDir: string;
  /** 构建目录绝对路径 */
  absDir: string;
}

/**
 * 展开预算目标为实际构建目录（供 CI 侧遍历全部应用）。
 *
 * `*` 模式按其父目录下的真实子目录展开。
 *
 * @param config 预算配置
 * @param root 仓库根绝对路径
 * @returns 展开后的目标列表
 */
export function expandBudgetTargets(config: BudgetConfig, root: string): ResolvedBudgetTarget[] {
  const expanded: ResolvedBudgetTarget[] = [];
  for (const target of config.targets) {
    if (!target.appDir.includes('*')) {
      expanded.push({ target, relDir: target.appDir, absDir: join(root, target.appDir) });
      continue;
    }
    const wildcardIndex = target.appDir.indexOf('*');
    const parentRel = target.appDir.slice(0, wildcardIndex).replace(/\/$/, '');
    const tailRel = target.appDir.slice(wildcardIndex + 1).replace(/^\//, '');
    const parentAbs = join(root, parentRel);
    if (!statSync(parentAbs, { throwIfNoEntry: false })?.isDirectory()) {
      continue;
    }
    for (const entry of readdirSync(parentAbs, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }
      const relDir = tailRel ? `${parentRel}/${entry.name}/${tailRel}` : `${parentRel}/${entry.name}`;
      expanded.push({ target, relDir, absDir: join(root, relDir) });
    }
  }
  return expanded;
}

/**
 * 计算文本内容的 gzip 体积（KB）。
 *
 * @param content 待测量的文本内容（构建后的 chunk 源码）
 * @returns gzip 后的体积（KB）
 */
export function gzipSizeKB(content: string): number {
  return gzipSync(Buffer.from(content, 'utf8')).length / 1024;
}

/**
 * 递归收集目录树下的文件绝对路径。
 *
 * @param dir 起始目录
 * @param acc 累加器
 * @returns 文件绝对路径列表
 */
function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * 体积保留一位小数（KB）。
 *
 * @param sizeKB 体积（KB）
 * @returns 保留一位小数的体积
 */
export function roundKB(sizeKB: number): number {
  return Math.round(sizeKB * 10) / 10;
}

/**
 * 测量一个构建目录里 JS+CSS 产物的 gzip 体积画像。
 *
 * 与构建期插件同口径：排除 .map，其余按 gzip 后字节计。
 *
 * @param buildDir 构建目录绝对路径（应用根，产物再位于其 dist/ 下）
 * @returns 体积画像；目录缺失时 exists=false 且各项为 0
 */
export function measureDistDir(buildDir: string): BudgetMeasure {
  const distDir = join(buildDir, 'dist');
  if (!statSync(distDir, { throwIfNoEntry: false })?.isDirectory()) {
    return {
      exists: false,
      measuredAt: '',
      totalGzipKB: 0,
      maxChunkGzipKB: 0,
      maxCssGzipKB: 0,
      jsFiles: 0,
    };
  }
  const measure: BudgetMeasure = {
    exists: true,
    measuredAt: '',
    totalGzipKB: 0,
    maxChunkGzipKB: 0,
    maxCssGzipKB: 0,
    jsFiles: 0,
  };
  for (const file of walkFiles(distDir)) {
    if (file.endsWith('.map') || !ASSET_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      continue;
    }
    const sizeKB = gzipSync(readFileSync(file)).length / 1024;
    measure.totalGzipKB += sizeKB;
    if (file.endsWith('.css')) {
      measure.maxCssGzipKB = Math.max(measure.maxCssGzipKB, sizeKB);
    } else {
      measure.jsFiles += 1;
      measure.maxChunkGzipKB = Math.max(measure.maxChunkGzipKB, sizeKB);
    }
  }
  measure.totalGzipKB = roundKB(measure.totalGzipKB);
  measure.maxChunkGzipKB = roundKB(measure.maxChunkGzipKB);
  measure.maxCssGzipKB = roundKB(measure.maxCssGzipKB);
  return measure;
}

/**
 * 按预算目标给出超限明细（构建期与 CI 期共用同一判据、同一文案）。
 *
 * @param target 预算目标
 * @param measure 实测画像
 * @returns 超限说明；空数组即合格
 */
export function budgetViolations(target: BudgetTarget, measure: BudgetMeasure): string[] {
  const violations: string[] = [];
  if (measure.totalGzipKB > target.maxTotalGzipKB) {
    violations.push(
      `总产出 ${formatKB(measure.totalGzipKB)} > ${target.maxTotalGzipKB}KB（JS+CSS，gzip）`,
    );
  }
  if (measure.jsFiles > target.maxFiles) {
    violations.push(`JS 文件数 ${measure.jsFiles} > ${target.maxFiles}`);
  }
  if (measure.maxChunkGzipKB > target.maxChunkGzipKB) {
    violations.push(
      `最大 JS chunk ${formatKB(measure.maxChunkGzipKB)} > ${target.maxChunkGzipKB}KB（gzip）`,
    );
  }
  if (measure.maxCssGzipKB > target.maxCssGzipKB) {
    violations.push(
      `最大 CSS ${formatKB(measure.maxCssGzipKB)} > ${target.maxCssGzipKB}KB（gzip）`,
    );
  }
  return violations;
}

/**
 * 格式化体积数值用于日志输出。
 *
 * @param sizeKB 体积（KB）
 * @returns 保留一位小数的可读字符串
 */
export function formatKB(sizeKB: number): string {
  return `${sizeKB.toFixed(1)}KB`;
}

/** 棘轮头寸：实测值之上允许的浮动比例 */
export interface RatchetHeadroom {
  /** 总体积头寸 */
  total: number;
  /** 单 chunk 头寸 */
  chunk: number;
  /** 单 CSS 头寸 */
  css: number;
  /** JS 文件数头寸 */
  files: number;
}

/** 默认头寸：一次常规依赖增长不该触发红灯，但 8% 以上的膨胀必须有人解释 */
const DEFAULT_HEADROOM: RatchetHeadroom = { total: 0.08, chunk: 0.1, css: 0.25, files: 0.15 };

/**
 * 由实测值算出建议棘轮阈值（向上取整），供 `check:size --report` 直接产出配置片段。
 *
 * @param measure 实测画像
 * @param headroom 头寸比例，默认 {@link DEFAULT_HEADROOM}
 * @returns 可写进 conf/budget.config.json 的阈值字段
 */
export function suggestRatchet(
  measure: BudgetMeasure,
  headroom: RatchetHeadroom = DEFAULT_HEADROOM,
): Pick<BudgetTarget, 'maxTotalGzipKB' | 'maxChunkGzipKB' | 'maxCssGzipKB' | 'maxFiles'> {
  return {
    maxTotalGzipKB: Math.ceil(measure.totalGzipKB * (1 + headroom.total)),
    maxChunkGzipKB: Math.ceil(measure.maxChunkGzipKB * (1 + headroom.chunk)),
    maxCssGzipKB: Math.ceil(measure.maxCssGzipKB * (1 + headroom.css)),
    maxFiles: Math.ceil(measure.jsFiles * (1 + headroom.files)),
  };
}
