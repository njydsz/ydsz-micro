/**
 * useTableFilterStorage —— 表格筛选条件持久化 composable。
 *
 * <p>将表格的筛选条件保存到 localStorage，下次打开页面时自动恢复用户上次配置。
 *
 * <p>设计要点（对标 useTableColumnStorage 模式）：
 * <ul>
 *   <li>key 隔离：每个 tableId 独立存储，前缀 ydsz:table:filters:{tableId}</li>
 *   <li>过期策略：默认 7 天自动过期，避免脏数据长期残留</li>
 *   <li>容错静默：JSON 解析失败、localStorage 不可用时静默降级</li>
 *   <li>TTL 而非 updatedAt：存储时写入 expireAt 绝对时间戳，读取时一次判断</li>
 * </ul>
 *
 * <p>典型用法（通常由 useTableData 内部调用，业务侧无需直接使用）：
 * <pre>
 *   const { filters, save, clear, load } = useTableFilterStorage({
 *     tableId: 'order-list',
 *     defaultFilters: { status: ['active'] },
 *   });
 *   load(); // 从 localStorage 恢复（通常在 useTableData 初始化时已完成）
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-filter-storage.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { ref, type Ref } from 'vue';

/* ============================================================ */
/* 常量                                                          */
/* ============================================================ */

/** localStorage key 前缀 */
const STORAGE_PREFIX = 'ydsz:table:filters:';

/** 默认过期时间（毫秒）—— 7 天 */
const DEFAULT_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** localStorage 中存储的完整结构 */
interface StoragePayload {
  /** 筛选条件 */
  filters: Record<string, unknown>;
  /** 绝对过期时间戳（毫秒） */
  expireAt: number;
}

/** useTableFilterStorage 参数 */
export interface UseTableFilterStorageOptions {
  /** 唯一标识，用于 localStorage key */
  tableId: string;
  /** 默认筛选条件 */
  defaultFilters?: Record<string, unknown>;
  /** 过期时间（毫秒），默认 7 天 */
  expireMs?: number;
  /** 是否启用持久化，默认 true */
  enabled?: boolean;
}

/** useTableFilterStorage 返回句柄 */
export interface UseTableFilterStorageReturn {
  /** 筛选条件 ref */
  filters: Ref<Record<string, unknown>>;
  /** 保存筛选条件到 localStorage */
  save: (filters: Record<string, unknown>) => void;
  /** 清除持久化数据 */
  clear: () => void;
  /** 从 localStorage 加载（返回是否成功） */
  load: () => boolean;
}

/* ============================================================ */
/* 工具函数                                                       */
/* ============================================================ */

/**
 * 从 localStorage 读取原始字符串。
 *
 * @param key - 完整 key
 * @return 原始字符串或 null
 */
function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage 不可用时（隐私模式、SSR 等）静默降级
    return null;
  }
}

/**
 * 向 localStorage 写入原始字符串。
 *
 * @param key - 完整 key
 * @param value - 要写入的字符串
 */
function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota exceeded 等写入失败时静默降级
  }
}

/**
 * 从 localStorage 移除指定 key。
 *
 * @param key - 完整 key
 */
function removeRaw(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 解析存储 payload，检查时效性。
 *
 * @param raw - JSON 字符串
 * @return 解析成功且在有效期内返回 filters，否则返回 null
 */
function parsePayload(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoragePayload;
    // 结构校验
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expireAt !== 'number') {
      return null;
    }
    // 过期检查
    if (Date.now() > parsed.expireAt) {
      return null;
    }
    return parsed.filters ?? null;
  } catch {
    // JSON 格式化失败时降级返回 null
    return null;
  }
}

/* ============================================================ */
/* useTableFilterStorage                                          */
/* ============================================================ */

/**
 * useTableFilterStorage —— 表格筛选条件持久化管理。
 *
 * @param options - 配置项
 * @return 筛选条件持久化 API
 */
export function useTableFilterStorage(
  options: UseTableFilterStorageOptions,
): UseTableFilterStorageReturn {
  const {
    tableId,
    defaultFilters = {},
    expireMs = DEFAULT_EXPIRE_MS,
    enabled = true,
  } = options;

  const storageKey = `${STORAGE_PREFIX}${tableId}`;

  /* ----- 初始化：尝试从 localStorage 读取 ----- */
  const enabledRef = enabled && typeof localStorage !== 'undefined';
  const restored = enabledRef ? parsePayload(readRaw(storageKey)) : null;

  const filters = ref<Record<string, unknown>>(
    restored !== null ? { ...restored } : { ...defaultFilters },
  );

  /**
   * 从 localStorage 加载筛选条件。
   *
   * @return 是否成功加载（有有效数据时返回 true）
   */
  function load(): boolean {
    if (!enabledRef) return false;
    const result = parsePayload(readRaw(storageKey));
    if (result !== null) {
      filters.value = { ...result };
      return true;
    }
    return false;
  }

  /**
   * 保存筛选条件到 localStorage。
   *
   * @param value - 筛选条件对象
   */
  function save(value: Record<string, unknown>): void {
    if (!enabledRef) return;
    const payload: StoragePayload = {
      expireAt: Date.now() + expireMs,
      filters: value,
    };
    writeRaw(storageKey, JSON.stringify(payload));
  }

  /**
   * 清除持久化数据并恢复默认值。
   */
  function clear(): void {
    if (enabledRef) {
      removeRaw(storageKey);
    }
    filters.value = { ...defaultFilters };
  }

  return {
    clear,
    filters,
    load,
    save,
  };
}
