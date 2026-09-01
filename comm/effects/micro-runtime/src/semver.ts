/**
 * 轻量语义化版本比较工具（~110 行，零依赖）。
 * 支持范围语法：`>=1.2.0`、`^1.2.0`、`~1.2.0`、`1.2.0 - 2.0.0`、`*`
 *
 * @path comm\effects\micro-runtime\src\semver.ts
 * @author ydsz-team
 * @since 4.0.0
 */

/**
 * 解析后的语义化版本号（SemVer 2.0.0 的最小子集）。
 *
 * 只保留微前端版本协商真正需要的四个字段：构建元数据（`+build`）
 * 按 SemVer 规定不参与优先级比较，因此刻意不解析、不存储。
 */
export interface SemVer {
  /** 主版本号，不兼容的 API 变更时递增 */
  major: number;
  /** 次版本号，向下兼容的功能新增时递增 */
  minor: number;
  /** 修订号，向下兼容的问题修复时递增 */
  patch: number;
  /** 预发布标识（如 `alpha.1`、`beta`、`rc.2`）；正式版为 undefined */
  prerelease?: string;
}

/**
 * 将版本字符串解析为结构化版本号。
 *
 * 实现为严格匹配而非宽松匹配：带 `v` 前缀（`v1.2.0`）、缺位（`1.2`）、
 * 四位版本号都会被判为非法并返回 null。这是刻意的取舍——本模块用于
 * 子应用版本协商，静默接受畸形版本会导致灰度规则命中错误版本，
 * 宁可解析失败让调用方走降级路径，也不猜测语义。
 *
 * @param v - 待解析的版本字符串，形如 `1.2.0` 或 `1.2.0-beta.1`
 * @returns 解析成功返回版本号对象；格式非法返回 null，**不抛异常**
 *
 * @example
 * ```ts
 * parseVersion('1.2.0-beta.1'); // { major: 1, minor: 2, patch: 0, prerelease: 'beta.1' }
 * parseVersion('v1.2.0');       // null（不接受 v 前缀）
 * ```
 */
export function parseVersion(v: string): SemVer | null {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/);
  if (!m) return null;
  const [, major, minor, patch, prerelease] = m;
  if (major === undefined || minor === undefined || patch === undefined) return null;
  return { major: +major, minor: +minor, patch: +patch, prerelease };
}

/**
 * 比较两个版本号的优先级（SemVer 11 条比较规则）。
 *
 * 比较次序：major → minor → patch → 预发布标识。预发布版本优先级
 * **低于**对应的正式版（`1.0.0-alpha` < `1.0.0`），这是 SemVer 的规定，
 * 也直接影响灰度逻辑：canary 版本必须显式升级为正式版才能被稳定流量命中。
 *
 * 预发布标识之间用 `localeCompare` 而非逐段比较，因此 `alpha.10` 会排在
 * `alpha.9` 之前（字符串序）。本仓库预发布段不超过个位数，未引入
 * dot-separated 数值比较的额外开销。
 *
 * @param a - 左操作数
 * @param b - 右操作数
 * @returns a < b 返回负数；a === b 返回 0；a > b 返回正数
 *
 * @example
 * ```ts
 * compareVersion(parseVersion('1.0.0-alpha')!, parseVersion('1.0.0')!); // -1
 * ```
 */
export function compareVersion(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  // 走到这里三段完全相同，区别只在预发布标识：有预发布的一方优先级更低
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && b.prerelease) return a.prerelease.localeCompare(b.prerelease);
  return 0;
}

/**
 * 判断版本是否落在给定范围表达式内。
 *
 * 支持的语法子集（覆盖微前端版本协商的全部场景，不追求 npm 全兼容）：
 * - `*`、`x`、`''` —— 任意版本
 * - `1.2.0 - 2.0.0` —— 闭区间
 * - `^1.2.0` —— 主版本不变，且不低于 1.2.0
 * - `~1.2.0` —— 主次版本不变，且修订号不低于 0
 * - `>=` / `>` / `<=` / `<` / `=` + 版本号，缺省操作符按 `=` 处理
 *
 * 不支持 `||` 组合与空格分隔的多个区间；需要组合时调用方自行拆分后取或。
 *
 * @param version - 待判定的版本号，格式非法时直接返回 false
 * @param range - 范围表达式，两端空白会被 trim
 * @returns 命中返回 true；**版本或范围任一无法解析都返回 false**（失败即拒绝，
 *          避免因解析失败把流量错误地放行给不匹配的子应用版本）
 *
 * @example
 * ```ts
 * satisfiesVersion('1.3.0', '^1.2.0'); // true
 * satisfiesVersion('2.0.0', '^1.2.0'); // false（主版本变更）
 * satisfiesVersion('1.0.0-beta', '>=1.0.0'); // false（预发布低于正式版）
 * ```
 */
export function satisfiesVersion(version: string, range: string): boolean {
  const v = parseVersion(version);
  if (!v) return false;
  const r = range.trim();
  if (r === '*' || r === 'x' || r === '') return true;
  const rangeMatch = r.match(/^(\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+)$/);
  // 闭区间必须先于比较符分支处理：区间语法以数字开头，
  // 若落到下面的 opMatch 会被当作裸版本号而误判为 false
  if (rangeMatch) {
    const lo = rangeMatch[1] !== undefined ? parseVersion(rangeMatch[1]) : null;
    const hi = rangeMatch[2] !== undefined ? parseVersion(rangeMatch[2]) : null;
    if (!lo || !hi) return false;
    return compareVersion(v, lo) >= 0 && compareVersion(v, hi) <= 0;
  }
  if (r.startsWith('^')) {
    const base = parseVersion(r.slice(1));
    if (!base) return false;
    // 用 major 相等而非 minor/patch 上界剪枝：^0.x 在 npm 语义下有特例
    // （^0.2.3 等价于 >=0.2.3 <0.3.0），本模块对 0.x 不做收窄，
    // 即 ^0.2.3 允许 0.9.0 —— 子应用 0.x 阶段本就处于快速迭代期
    return v.major === base.major && compareVersion(v, base) >= 0;
  }
  if (r.startsWith('~')) {
    const base = parseVersion(r.slice(1));
    if (!base) return false;
    // 直接比较 minor/patch 而非拼出上界再 compare，省去一次对象构造
    return v.major === base.major && v.minor === base.minor && v.patch >= base.patch;
  }
  const opMatch = r.match(/^(>=|>|<=|<|=)?\s*(\d+\.\d+\.\d+.*)$/);
  if (opMatch) {
    const op = opMatch[1] ?? '=';
    const ver = opMatch[2];
    if (ver === undefined) return false;
    const target = parseVersion(ver);
    if (!target) return false;
    const cmp = compareVersion(v, target);
    switch (op) {
      case '>=': return cmp >= 0;
      case '>': return cmp > 0;
      case '<=': return cmp <= 0;
      case '<': return cmp < 0;
      default: return cmp === 0;
    }
  }
  return false;
}
