/**
 * JSON 展示与解析工具
 * <p>面向接口返回的未知结构（unknown）提供安全的展示与解析能力，
 * <p>供 DSL 工具栏、断点调试、CEP 等页面复用。
 *
 * @path apps\literule-web\src\utils\format.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 将未知数据安全地格式化为可展示文本。
 *
 * @remarks
 * - 字符串原样返回；对象/数组使用 JSON.stringify 美化输出；其他原始值转为字符串；
 * - 序列化失败时回退为 String 强转，保证任何输入都不会抛错。
 *
 * @param data - 待展示的未知数据
 * @returns 可放入 pre/文本节点直接展示的字符串；空值返回空字符串
 */
export function formatJsonResult(data: unknown): string {
  if (data === undefined || data === null) {
    return '';
  }
  if (typeof data === 'string') {
    return data;
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * 将未知数据安全地转换为对象数组。
 *
 * @remarks 非数组或元素不是对象的场景返回空数组，供断点/会话列表等 unknown 接口结果兜底。
 *
 * @param data - 接口返回的未知数据
 * @returns 规范化后的 Record 数组（元素仅保留对象类型）
 */
export function toRecordList(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(
    (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
  );
}

/**
 * 将未知值安全地转换为 Record 对象。
 *
 * @remarks 非对象值（字符串/数字/null 等）返回空对象，避免调用方空指针。
 *
 * @param value - 待转换的未知值
 * @returns 对象形式的 Record；非法输入返回空对象
 */
export function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * 解析 JSON 对象文本。
 *
 * @param text - 期望为 JSON 对象的文本
 * @returns 解析成功返回对象；文本非法或不是对象返回 null
 */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 解析 JSON 数组文本（元素应为对象）。
 *
 * @param text - 期望为 JSON 数组的文本
 * @returns 解析成功返回对象数组；文本非法或不是数组返回 null
 */
export function parseJsonArray(text: string): Record<string, unknown>[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return toRecordList(parsed);
    }
    return null;
  } catch {
    return null;
  }
}
