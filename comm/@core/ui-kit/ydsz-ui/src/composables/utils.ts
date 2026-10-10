/**
 * ydsz-ui composables 内部通用工具函数
 *
 * 提供跨 composables 复用的存储键构造等基础能力，避免在各 composable 内部重复实现。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\utils.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 存储键前缀，用于所有 ydsz-ui composables 的 localStorage 隔离 */
const STORAGE_KEY_PREFIX = 'ydsz:composables:';

/**
 * 构造带命名前缀的存储键，避免 composables 之间或与其他业务键冲突。
 *
 * @param key - 业务标识键（建议包含页面或功能名称）
 * @returns 带 ydsz 命名空间前缀的 localStorage 键
 *
 * @example
 * ```ts
 * const draftKey = createStorageKey('form-draft:user-edit');
 * // => 'ydsz:composables:form-draft:user-edit'
 * ```
 */
export function createStorageKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}${key}`;
}

/**
 * 从 localStorage 安全读取并解析 JSON 值。
 *
 * @param key - localStorage 键
 * @returns 解析后的值，不存在或解析失败返回 undefined
 */
export function readStorageItem<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * 向 localStorage 写入 JSON 值。写入失败（如 quota exceeded）时静默忽略。
 *
 * @param key - localStorage 键
 * @param value - 待序列化的值
 */
export function writeStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 静默：超出配额或序列化失败时不阻塞调用方
  }
}

/**
 * 移除 localStorage 中的指定键。
 *
 * @param key - 待移除的 localStorage 键
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 静默
  }
}
