/**
 * budget-config.ts — 产物体积预算配置的读取与目标匹配
 *
 * 从仓库 `conf/budget.config.json`（单一事实源）读取体积预算，供构建期
 * bundle-budget 插件使用；CI 侧的 `bash/check-size.mjs` 读取同一份配置，
 * 从而消除「构建期 5MB/15MB、CI 期 512KB/384KB」的双轨矛盾，两侧口径统一为 gzip。
 *
 * @path conf/vite-config/src/plugins/budget-config.ts
 * @author ydsz-team
 * @since 26.09.14
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

/** 单个构建目标的体积预算（gzip 口径，单位 KB） */
export interface BudgetTarget {
  /** 目标名：main-web（主应用）/ sub-app（子应用集群） */
  name: string;
  /** 所属范围，与仓库目录首段一致（main / apps），用于按构建目录匹配目标 */
  scope: string;
  /** 产物目录模式（相对仓库根，可含 * 通配） */
  assetsDirPattern: string;
  /** 单次构建总产出 gzip 体积上限（KB，JS+CSS 合计） */
  maxTotalGzipKB: number;
  /** JS 产物文件数上限 */
  maxFiles: number;
  /** 单个 JS chunk 的 gzip 体积上限（KB） */
  maxChunkGzipKB: number;
  /** 单个 CSS 文件的 gzip 体积上限（KB） */
  maxCssGzipKB: number;
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

/** 预算配置相对仓库根的路径 */
const CONFIG_RELATIVE_PATH = 'conf/budget.config.json';

/** 向上查找仓库根的最大层级（防御异常路径下的无限循环） */
const MAX_ROOT_SEARCH_DEPTH = 10;

/** 仓库根标志文件：单一工作区定义 */
const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

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
 * 配置文件虽属仓库内资产，但按规范「外部数据必须校验」的要求做结构守卫，
 * 避免配置被误改后插件静默跳过校验。
 *
 * @param value 待校验的解析结果
 * @returns 是否为合法预算配置
 */
function isBudgetConfig(value: unknown): value is BudgetConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { targets?: unknown };
  return Array.isArray(candidate.targets) && candidate.targets.length > 0;
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
 * 按当前构建目录匹配预算目标。
 *
 * 构建时 `process.cwd()` 为被构建应用的根目录（`main/` 或 `apps/xxx-web/`），
 * 取其相对仓库根的首段与目标 scope 比对。
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
  const relativePath = cwd.slice(root.length + 1).replaceAll('\\', '/');
  const scope = relativePath.split('/')[0];
  return config.targets.find((target) => target.scope === scope) ?? null;
}

/**
 * 计算文本内容的 gzip 体积（KB，保留一位小数）。
 *
 * @param content 待测量的文本内容（构建后的 chunk 源码）
 * @returns gzip 后的体积（KB）
 */
export function gzipSizeKB(content: string): number {
  return gzipSync(Buffer.from(content, 'utf8')).length / 1024;
}
