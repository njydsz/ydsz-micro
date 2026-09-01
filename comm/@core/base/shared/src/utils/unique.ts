/**
 * 对象数组去重工具集，按指定字段消除重复项并保持首次出现顺序。
 *
 * @path comm\@core\base\shared\src\utils\unique.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 按指定字段对对象数组进行去重，保留首次出现的元素。
 *
 * @param arr - 待去重的对象数组
 * @param key - 去重依据的字段名
 * @returns 去重后的对象数组
 */
function uniqueByField<T>(arr: T[], key: keyof T): T[] {
  const seen = new Map<unknown, T>();
  return arr.filter((item) => {
    const value = item[key];
    return seen.has(value) ? false : (seen.set(value, item), true);
  });
}

export { uniqueByField };
