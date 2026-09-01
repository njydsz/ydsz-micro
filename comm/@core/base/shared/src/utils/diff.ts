/**
 * 对象差异比较与数组相等判断工具。
 *
 * @path comm\@core\base\shared\src\utils\diff.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 比较两个数组是否相等（元素相同且出现次数一致，忽略顺序）。
 *
 * @param a - 待比较数组 a
 * @param b - 待比较数组 b
 * @returns 相等返回 `true`，否则 `false`
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const counter = new Map<T, number>();
  for (const value of a) {
    counter.set(value, (counter.get(value) || 0) + 1);
  }
  for (const value of b) {
    const count = counter.get(value);
    if (count === undefined || count === 0) {
      return false;
    }
    counter.set(value, count - 1);
  }
  return true;
}

type DiffResult<T> = Partial<{
  [K in keyof T]: T[K] extends object ? DiffResult<T[K]> : T[K];
}>;

/**
 * 深度比较两个对象的差异
 * @param obj1 原始对象
 * @param obj2 目标对象
 * @returns 差异结果，无差异时返回 undefined
 */
function diff<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T,
): DiffResult<T> {
  function findDifferences(
    o1: Record<string, unknown>,
    o2: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (Array.isArray(o1) && Array.isArray(o2)) {
      if (!arraysEqual(o1, o2)) {
        return o2 as Record<string, unknown>;
      }
      return undefined;
    }

    if (
      typeof o1 === 'object' &&
      typeof o2 === 'object' &&
      o1 !== null &&
      o2 !== null
    ) {
      const diffResult: Record<string, unknown> = {};

      const keys = new Set([...Object.keys(o1), ...Object.keys(o2)]);
      keys.forEach((key) => {
        const valueDiff = findDifferences(
          (o1 as Record<string, unknown>)[key] as Record<string, unknown>,
          (o2 as Record<string, unknown>)[key] as Record<string, unknown>,
        );
        if (valueDiff !== undefined) {
          diffResult[key] = valueDiff;
        }
      });

      return Object.keys(diffResult).length > 0 ? diffResult : undefined;
    }

    return o1 === o2 ? undefined : (o2 as Record<string, unknown>);
  }

  return findDifferences(
    obj1 as Record<string, unknown>,
    obj2 as Record<string, unknown>,
  ) as DiffResult<T>;
}

export { arraysEqual, diff };
