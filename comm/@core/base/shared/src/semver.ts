/**
 * 轻量语义化版本比较工具（零依赖）。
 * 支持范围语法：`>=1.2.0`、`^1.2.0`、`~1.2.0`、`1.2.0 - 2.0.0`、`*`
 *
 * 从 @ydsz/micro-runtime/semver 下沉到 @YDSZ-core/shared，消除 micro-runtime
 * 对非业务模块的依赖。
 *
 * @path comm\@core\base\shared\src\semver.ts
 * @since 5.6.0
 */
export interface SemVer { major: number; minor: number; patch: number; prerelease?: string }

/**
 * 解析语义化版本字符串为结构化对象（major.minor.patch + 可选 prerelease）。
 *
 * @param v - 版本字符串，如 `'1.2.3-beta.1'`
 * @returns 解析成功返回 SemVer 对象；格式不匹配返回 null
 */
export function parseVersion(v: string): SemVer | null {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease: m[4] };
}

/**
 * 比较两个 SemVer 的大小，正值表示 a > b，负值表示 a < b，0 表示相等。
 *
 * @param a - 待比较版本 a
 * @param b - 待比较版本 b
 * @returns 正值 a > b；负值 a < b；0 表示相等
 */
export function compareVersion(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && b.prerelease) return a.prerelease.localeCompare(b.prerelease);
  return 0;
}

/**
 * 判断版本是否满足范围表达式（支持 `>=`、`>`、`<=`、`<`、`=`、`^`、`~`、区间与 `*`）。
 *
 * @param version - 待判定版本字符串
 * @param range - 范围表达式，如 `'^1.2.0'`、`'>=1.0.0 <2.0.0'`
 * @returns 满足返回 `true`
 */
export function satisfiesVersion(version: string, range: string): boolean {
  const v = parseVersion(version);
  if (!v) return false;
  const r = range.trim();
  if (r === '*' || r === 'x' || r === '') return true;
  const rangeMatch = r.match(/^(\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+)$/);
  if (rangeMatch) {
    const lo = parseVersion(rangeMatch[1]!);
    const hi = parseVersion(rangeMatch[2]!);
    if (!lo || !hi) return false;
    return compareVersion(v, lo) >= 0 && compareVersion(v, hi) <= 0;
  }
  if (r.startsWith('^')) {
    const base = parseVersion(r.slice(1));
    if (!base) return false;
    return v.major === base.major && compareVersion(v, base) >= 0;
  }
  if (r.startsWith('~')) {
    const base = parseVersion(r.slice(1));
    if (!base) return false;
    return v.major === base.major && v.minor === base.minor && v.patch >= base.patch;
  }
  const opMatch = r.match(/^(>=|>|<=|<|=)?\s*(\d+\.\d+\.\d+.*)$/);
  if (opMatch) {
    const op = opMatch[1] || '=';
    const ver = opMatch[2]!;
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