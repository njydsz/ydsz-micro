/**
 * storage-utils.ts — localStorage 统一抽象层
 *
 * P0-4: 解决当前 localStorage 使用碎片化问题：
 * - 统一命名空间前缀，防止 key 冲突
 * - 封装 try-catch + JSON 序列化，减少样板代码
 * - 容量检测：写入超限自动降级（console.warn）
 * - 提供命名空间操作（按前缀批量清理）
 *
 * 支持的模块 key（集中式注册，便于审计）：
 * | Key 后缀 | 使用模块 | 用途 |
 * |---------|---------|------|
 * | canary-config | canary-manager | 灰度配置缓存 |
 * | preload-stats | preload-strategy | 子应用使用频率统计 |
 * | route-predictions | route-predictor | 路由转移矩阵 |
 * | version-cache | version-manager | 子应用版本信息缓存 |
 * | registry-cache | registry-adapter | 远程注册表缓存 |
 * | error-locale | error-boundary | 用户语言偏好 |
 *
 * @path comm/effects/micro-kernel/src/storage-utils.ts
 * @author ydsz-team
 * @since 4.2.0
 */

/**
 * 统一命名空间前缀，防止与业务方/其他库冲突
 */
const NAMESPACE_PREFIX = "micro-kernel:";

/**
 * 预留的 key 注册表（集中式 key 管理，便于审计冲突）
 *
 * 所有使用存储的模块应在此注册 key，禁止使用未注册的 key。
 */
export const STORAGE_KEYS = {
  CANARY_CONFIG: `${NAMESPACE_PREFIX}canary-config`,
  PRELOAD_STATS: `${NAMESPACE_PREFIX}preload-stats`,
  ROUTE_PREDICTIONS: `${NAMESPACE_PREFIX}route-predictions`,
  /** 保持与旧版 version-manager 一致的 key，避免数据迁移 */
  VERSION_CACHE: `${NAMESPACE_PREFIX}versions`,
  REGISTRY_CACHE: `${NAMESPACE_PREFIX}registry-cache`,
} as const;

/** storage key 类型 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** 估算的 localStorage 容量上限（主流浏览器 ~5MB，保守按 4MB 检测） */
const CAPACITY_LIMIT_BYTES = 4 * 1024 * 1024;

/** 当前占用的字节数估算缓存 */
let _estimatedSize: null | number = null;

/**
 * 计算字符串字节数（UTF-8，中文 3 字节）
 */
function byteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7_ff) {
      bytes += 2;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * 检测 localStorage 剩余容量是否充足。
 *
 * 浏览器满时不同表现：
 * - Chrome/Firefox: 抛出 QuotaExceededError
 * - Safari: 静默失败（不抛错）
 *
 * 通过估算写入大小 + 当前占用，在写入前预警。
 *
 * @param key - 要写入的 key
 * @param value - 要写入的序列化字符串
 * @returns 是否允许写入
 */
function checkCapacity(key: string, value: string): boolean {
  if (typeof localStorage === "undefined") return false;

  const incomingSize = byteLength(key) + byteLength(value);

  // 简单估算：遍历当前所有 micro-kernel: 前缀的条目
  if (_estimatedSize === null) {
    _estimatedSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(NAMESPACE_PREFIX)) {
          const v = localStorage.getItem(k) || "";
          _estimatedSize += byteLength(k) + byteLength(v);
        }
      }
    } catch {
      // 无法读取则放行，让实际 setItem 去兜底
      return true;
    }
  }

  // 若估算接近容量上限，标记告警
  if (_estimatedSize + incomingSize > CAPACITY_LIMIT_BYTES) {
    console.warn(
      `[micro-kernel] 存储接近容量上限（预估 ${_estimatedSize + incomingSize} 字节，限制 ${CAPACITY_LIMIT_BYTES} 字节），部分数据可能写入失败。`,
    );
    return false;
  }

  return true;
}

/**
 * 安全设置 localStorage 值。
 *
 * 封装 JSON 序列化 + 容量检测 + 异常静默。
 * 写入成功后更新估算缓存。
 *
 * @param key - 存储 key（应使用 STORAGE_KEYS 常量）
 * @param value - 要存储的任意 JSON 可序列化值
 * @returns 是否写入成功
 *
 * @example
 * ```ts
 * setStorage(STORAGE_KEYS.CANARY_CONFIG, { enabled: true, apps: [] });
 * ```
 */
export function setStorage<T>(key: StorageKey | string, value: T): boolean {
  if (typeof localStorage === "undefined") return false;

  try {
    const serialized = JSON.stringify(value);
    if (!checkCapacity(key, serialized)) {
      // 容量告警但继续写入尝试（可能之前估算不准）
    }
    localStorage.setItem(key, serialized);
    // 更新估算缓存
    if (_estimatedSize !== null) {
      _estimatedSize += byteLength(key) + byteLength(serialized);
    }
    return true;
  } catch (error) {
    // QuotaExceededError 或其他异常时静默降级
    console.warn(
      `[micro-kernel] 写入 ${key} 失败：`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * 安全读取 localStorage 值。
 *
 * 封装 JSON 反序列化 + 异常静默。读取失败返回 defaultValue。
 *
 * @param key - 存储 key（应使用 STORAGE_KEYS 常量）
 * @param defaultValue - 读取失败时的默认值
 * @returns 解析后的值，或 defaultValue
 *
 * @example
 * ```ts
 * const config = getStorage<CanaryGlobalConfig>(STORAGE_KEYS.CANARY_CONFIG, DEFAULT_CONFIG);
 * ```
 */
export function getStorage<T>(key: StorageKey | string, defaultValue: T): T {
  if (typeof localStorage === "undefined") return defaultValue;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    // 解析失败返回默认值
    return defaultValue;
  }
}

/**
 * 安全移除指定 key。
 *
 * @param key - 要移除的存储 key
 * @returns 是否移除成功
 */
export function removeStorage(key: StorageKey | string): boolean {
  if (typeof localStorage === "undefined") return false;

  try {
    localStorage.removeItem(key);
    // 清除估算缓存（下次读写时重新计算）
    _estimatedSize = null;
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理所有 micro-kernel 命名空间的存储条目。
 *
 * 用于重置/测试场景。不会删除其他命名空间的条目。
 *
 * @returns 清理的条目数
 */
export function clearNamespace(): number {
  if (typeof localStorage === "undefined") return 0;

  let removedCount = 0;
  try {
    // 倒序遍历，避免删除导致索引偏移
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(NAMESPACE_PREFIX)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    }
    _estimatedSize = 0;
  } catch {
    // 部分浏览器在隐私模式下可能无法访问 length
  }
  return removedCount;
}

/**
 * 检查浏览器是否支持 localStorage。
 *
 * 隐私模式、禁用 cookie/storage、SSR 环境下可能返回 false。
 *
 * 应在调用 getStorage/setStorage 前检查，防止 SSR 场景报错。
 */
export function isStorageAvailable(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    // 有些浏览器隐私模式下 localStorage 存在但 setItem 报错
    const testKey = `${NAMESPACE_PREFIX}__probe__`;
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 localStorage 当前占用的预估字节数（仅 micro-kernel 命名空间）。
 *
 * 用于 DevTools 展示。
 *
 * @returns 预估字节数；如果未缓存则返回 -1
 */
export function getStorageUsage(): number {
  if (_estimatedSize !== null) return _estimatedSize;

  if (typeof localStorage === "undefined") return 0;

  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(NAMESPACE_PREFIX)) {
        const value = localStorage.getItem(key) || "";
        total += byteLength(key) + byteLength(value);
      }
    }
    _estimatedSize = total;
  } catch {
    return 0;
  }
  return total;
}
