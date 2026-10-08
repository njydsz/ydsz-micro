/**
 * useTableFilterStorage —— 表格筛选条件持久化 composable。
 *
 * <p>将表格的筛选条件保存到 localStorage，下次打开页面时自动恢复用户上次配置。
 *
 * <p>设计要点（对标 useTableColumnStorage 模式）：
 * <ul>
 *   <li>key 隔离：每个 tableId 独立存储，前缀 ydsz:table-filter:{tableId}</li>
 *   <li>过期策略：默认 7 天自动过期，避免脏数据长期残留</li>
 *   <li>容错静默：JSON 解析失败、localStorage 不可用时静默降级</li>
 *   <li>类型安全：使用 PersistedFilterState 存储快照</li>
 * </ul>
 *
 * <p>典型用法（通常由 useTableData 内部调用，业务侧无需直接使用）：
 * <pre>
 *   const { filters, saveFilters, clearFilters } = useTableFilterStorage('order-list');
 *   // 初始化时可读取
 *   watch(filters, (v) => applyToTable(v));
 *   // 筛选变化后保存
 *   onFilterChange((vals) => saveFilters(vals));
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-filter-storage.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { ref, watch, type Ref } from 'vue';

import type { PersistedFilterState } from 'comm/types/global';

/* ============================================================ */
/* 常量                                                          */
/* ============================================================ */

/** localStorage key 前缀 */
const STORAGE_PREFIX = 'ydsz:table-filter:';

/** 默认过期时间（毫秒）—— 7 天 */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 写入防抖延迟（毫秒） */
const SAVE_DEBOUNCE_MS = 300;

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** useTableFilterStorage 参数 */
export interface UseTableFilterStorageOptions {
  /**
   * 表格唯一标识（建议用路由 name + 模块名），
   * 用作 localStorage key 的一部分以保证隔离。
   */
  tableId: string;
  /** 默认筛选条件（首次进入且无持久化数据时使用） */
  defaultValue?: Record<string, unknown>;
  /** 过期时间（毫秒），默认 7 天 */
  ttl?: number;
}

/** useTableFilterStorage 返回句柄 */
export interface UseTableFilterStorageReturn {
  /** 当前筛选条件（响应式） */
  filters: Ref<Record<string, unknown>>;
  /** 持久化筛选条件到 localStorage */
  saveFilters: (value: Record<string, unknown>) => void;
  /** 清除持久化存储并恢复默认值 */
  clearFilters: () => void;
  /** 是否从 localStorage 恢复了数据 */
  isRestored: Ref<boolean>;
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
 * @param ttl - 过期时间（毫秒）
 * @return 解析成功且在有效期内返回 filters，否则返回 null
 */
function parseFilters(
  raw: string | null,
  ttl: number,
): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedFilterState;
    // 结构校验
    if (!parsed || typeof parsed !== 'object' || typeof parsed.updatedAt !== 'number') {
      return null;
    }
    // 过期检查
    if (Date.now() - parsed.updatedAt > ttl) {
      return null;
    }
    // 返回筛选条件对象（兼容 filters 字段缺失时返回整个对象）
    return parsed.filters ?? null;
  } catch {
    // JSON 格式化失败时降级返回 null
    return null;
  }
}

/**
 * 对象序列化（处理 Date 等不可直接 JSON 的类型）。
 *
 * @param value - 要序列化的对象
 * @return 安全可序列化的对象
 */
function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
  return value;
}

/**
 * 反序列化，恢复 Date 等类型。
 *
 * @param value - 反序列化前的值
 * @return 恢复后的值
 */
function deserializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.__type === 'Date') {
      return new Date(obj.value as string);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = deserializeValue(v);
    }
    return result;
  }
  return value;
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
  const { tableId, defaultValue = {}, ttl = DEFAULT_TTL_MS } = options;
  const storageKey = `${STORAGE_PREFIX}${tableId}`;

  /* ----- 初始化：尝试从 localStorage 读取 ----- */
  const restoredFilters = parseFilters(readRaw(storageKey), ttl);
  const filters = ref<Record<string, unknown>>(
    restoredFilters !== null ? { ...restoredFilters } : { ...defaultValue },
  );
  const isRestored = ref<boolean>(restoredFilters !== null);

  /**
   * 持久化筛选条件到 localStorage。
   *
   * @param value - 条件对象
   */
  function saveFilters(value: Record<string, unknown>): void {
    // Date 等类型特殊处理
    const safeValue = serializeValue(value) as Record<string, unknown>;
    const payload: PersistedFilterState = {
      filters: safeValue,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // quota exceeded 等写入失败时静默降级
    }
  }

  /**
   * 清除持久化存储并恢复默认值。
   */
  function clearFilters(): void {
    removeRaw(storageKey);
    filters.value = { ...defaultValue };
    isRestored.value = false;
  }

  /* ----- 防抖写入 ----- */
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    filters,
    (newVal) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        saveFilters(newVal);
        debounceTimer = null;
      }, SAVE_DEBOUNCE_MS);
    },
    { deep: true },
  );

  return {
    clearFilters,
    filters,
    isRestored,
    saveFilters,
  };
}
