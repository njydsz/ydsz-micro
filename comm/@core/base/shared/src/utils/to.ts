/**
 * Promise 包裹器，将 rejected 异常转化为 `[error, undefined]` 元组，避免 try/catch 嵌套。
 *
 * @path comm\@core\base\shared\src\utils\to.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 将 Promise 包装为始终 resolved 的二元组，便于顺序化错误处理。
 *
 * @param promise - 待执行的 Promise
 * @param errorExt - 合并到错误对象的附加信息（可为空）
 * @returns `[null, data]` 或 `[error, undefined]`
 *
 * @example
 * ```ts
 * const [err, data] = await to(fetch('/api'));
 * if (err) return;
 * console.log(data);
 * ```
 */
export async function to<T, U = Error>(
  promise: Readonly<Promise<T>>,
  errorExt?: object,
): Promise<[null, T] | [U, undefined]> {
  try {
    const data = await promise;
    const result: [null, T] = [null, data];
    return result;
  } catch (error) {
    if (errorExt) {
      const parsedError = Object.assign({}, error, errorExt);
      return [parsedError as U, undefined];
    }
    return [error as U, undefined];
  }
}
