/**
 * 运行时环境与值的类型判断工具集。
 *
 * 提供 isUndefined / isBoolean / isEmpty / isHttpUrl / isWindow / isMacOs /
 * isWindowsOs / isNumber / getFirstNonNullOrUndefined 等纯函数判断工具，
 * 内部复用 @vue/shared 的 isFunction / isObject / isString，均无副作用。
 *
 * @path comm\@core\base\shared\src\utils\inference.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { isFunction, isObject, isString } from '@vue/shared';

/**
 * 检查传入的值是否为undefined。
 *
 * @param {unknown} value 要检查的值。
 * @returns {boolean} 如果值是undefined，返回true，否则返回false。
 */
function isUndefined(value?: unknown): value is undefined {
  return value === undefined;
}

/**
 * 检查传入的值是否为boolean
 * @param value
 * @returns 如果值是布尔值，返回true，否则返回false。
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查传入的值是否为空。
 *
 * 以下情况将被认为是空：
 * - 值为null。
 * - 值为undefined。
 * - 值为一个空字符串。
 * - 值为一个长度为0的数组。
 * - 值为一个没有元素的Map或Set。
 * - 值为一个没有属性的对象。
 *
 * @param {T} value 要检查的值。
 * @returns {boolean} 如果值为空，返回true，否则返回false。
 */
function isEmpty<T = unknown>(value?: T): value is T {
  if (value === null || value === undefined) {
    return true;
  }

  if (Array.isArray(value) || isString(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * 检查传入的字符串是否为有效的HTTP或HTTPS URL。
 *
 * @param {string} url 要检查的字符串。
 * @return {boolean} 如果字符串是有效的HTTP或HTTPS URL，返回true，否则返回false。
 */
function isHttpUrl(url?: string): boolean {
  if (!url) {
    return false;
  }
  // 使用正则表达式测试URL是否以http:// 或 https:// 开头
  const httpRegex = /^https?:\/\/.*$/;
  return httpRegex.test(url);
}

/**
 * 检查传入的值是否为window对象。
 *
 * @param {any} value 要检查的值。
 * @returns {boolean} 如果值是window对象，返回true，否则返回false。
 */
function isWindow(value: unknown): value is Window {
  return (
    typeof window !== 'undefined' &&
    value !== null &&
    value === (value as Window).window
  );
}

/**
 * 检查当前运行环境是否为 Mac OS。
 *
 * 通过解析 navigator.userAgent 判断，命中 `macintosh` 或 `mac os x`(不区分大小写)即视为 Mac。
 * 注意 userAgent 可被客户端篡改，不可用于安全敏感场景。
 */
function isMacOs(): boolean {
  const macRegex = /macintosh|mac os x/i;
  return macRegex.test(navigator.userAgent);
}

/**
 * 检查当前运行环境是否为 Windows OS。
 *
 * 通过解析 navigator.userAgent 判断，命中 `windows` 或 `win32`(不区分大小写)即视为 Windows。
 */
function isWindowsOs(): boolean {
  const windowsRegex = /windows|win32/i;
  return windowsRegex.test(navigator.userAgent);
}

/**
 * 检查传入的值是否为数字
 * @param value
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 从参数列表中返回第一个既非 null 也非 undefined 的值。
 *
 * @param values - 待检测的值列表
 * @returns 首个非空值；全部为空时返回 undefined
 *
 * @example
 * ```ts
 * getFirstNonNullOrUndefined(undefined, null, 42, 'hello'); // 42
 * getFirstNonNullOrUndefined(null, undefined);              // undefined
 * ```
 */
function getFirstNonNullOrUndefined<T>(
  ...values: (null | T | undefined)[]
): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

export {
  getFirstNonNullOrUndefined,
  isBoolean,
  isEmpty,
  isFunction,
  isHttpUrl,
  isMacOs,
  isNumber,
  isObject,
  isString,
  isUndefined,
  isWindow,
  isWindowsOs,
};
