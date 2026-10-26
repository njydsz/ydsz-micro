/**
 * 表格列个性化配置持久化组合式函数。
 *
 * <p>提供列可见性、列顺序、列宽度的响应式状态与持久化能力，
 * 支持 localStorage 存储（后端 API 扩展预留）。
 *
 * @path comm\@core\composables\src\use-table-column-preference.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Ref } from 'vue';

import { ref, watch } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('table-column-preference');

/** 列配置持久化条目（localStorage value 结构） */
interface ColumnPreferenceState {
  /** 可见列字段集合 */
  visibleColumns: string[];
  /** 列顺序（字段名数组） */
  columnOrder: string[];
  /** 列宽映射：字段名 → 像素值 */
  columnWidth: Record<string, number>;
}

/** 单个列的元信息（用于初始化默认值） */
interface ColumnMeta {
  /** 列字段名 */
  field: string;
  /** 默认宽度 */
  width?: number;
  /** 是否默认可见 */
  visible?: boolean;
}

/** composable 参数 */
interface UseTableColumnPreferenceOptions {
  /** 表格唯一标识（用于隔离不同表格的配置存储） */
  tableId: string;
  /** 列的元信息列表（用于推导默认值） */
  columns: ColumnMeta[];
  /** 是否启用持久化（默认 true） */
  persist?: boolean;
}

/** localStorage key 前缀 */
const STORAGE_KEY_PREFIX = 'ydsz_table_col_pref_';

/**
 * 读取 localStorage 中已保存的列配置。
 *
 * @param tableId - 表格唯一标识
 * @returns 已保存的配置对象；无记录或解析失败时返回 null
 */
function readFromStorage(tableId: string): null | ColumnPreferenceState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ColumnPreferenceState;
  } catch (error) {
    logger.warn('读取表格列配置失败', { tableId, error });
    return null;
  }
}

/**
 * 将列配置写入 localStorage。
 *
 * @param tableId - 表格唯一标识
 * @param state - 待持久化的配置状态
 */
function writeToStorage(tableId: string, state: ColumnPreferenceState): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${tableId}`,
      JSON.stringify(state),
    );
  } catch (error) {
    logger.warn('保存表格列配置失败', { tableId, error });
  }
}

/**
 * 从列元信息推导默认配置状态。
 *
 * @param columns - 列元信息列表
 * @returns 默认配置对象
 */
function deriveDefaults(columns: ColumnMeta[]): ColumnPreferenceState {
  return {
    visibleColumns: columns
      .filter((col) => col.visible !== false)
      .map((col) => col.field),
    columnOrder: columns.map((col) => col.field),
    columnWidth: columns.reduce<Record<string, number>>((acc, col) => {
      if (col.width) {
        acc[col.field] = col.width;
      }
      return acc;
    }, {}),
  };
}

/**
 * 表格列个性化配置持久化组合式函数。
 *
 * <p>管理列可见性、顺序、宽度三类状态，所有变更自动同步到 localStorage。
 * 启动时优先从 localStorage 恢复，无记录时使用 columns 参数推导默认值。
 *
 * @param options - composable 配置项
 * @returns 响应式状态与操作方法
 *
 * @example
 * ```ts
 * const {
 *   visibleColumns,
 *   columnOrder,
 *   columnWidth,
 *   saveToPreference,
 *   resetToDefault,
 * } = useTableColumnPreference({
 *   tableId: 'config-list',
 *   columns: [
 *     { field: 'configKey', width: 180 },
 *     { field: 'configValue', width: 200 },
 *     { field: 'description', width: 180, visible: false },
 *   ],
 * });
 * ```
 */
export function useTableColumnPreference(
  options: UseTableColumnPreferenceOptions,
): {
  /** 当前可见列字段集合（响应式） */
  visibleColumns: Ref<string[]>;
  /** 当前列顺序（响应式） */
  columnOrder: Ref<string[]>;
  /** 当前列宽映射（响应式） */
  columnWidth: Ref<Record<string, number>>;
  /** 手动触发保存（监听模式下通常无需手动调用） */
  saveToPreference: () => void;
  /** 从持久化存储重新加载配置 */
  loadFromPreference: () => void;
  /** 重置为默认配置（同时清除持久化记录） */
  resetToDefault: () => void;
  /** 设置列可见性 */
  setColumnVisible: (field: string, visible: boolean) => void;
  /** 设置列宽度 */
  setColumnWidth: (field: string, width: number) => void;
  /** 设置列顺序 */
  setColumnOrder: (order: string[]) => void;
} {
  const { tableId, columns, persist = true } = options;

  const defaults = deriveDefaults(columns);

  const visibleColumns = ref<string[]>([...defaults.visibleColumns]);
  const columnOrder = ref<string[]>([...defaults.columnOrder]);
  const columnWidth = ref<Record<string, number>>({ ...defaults.columnWidth });

  /**
   * 从持久化存储加载配置，合并到响应式状态。
   *
   * <p>合并策略：以 columns 中的字段为准，已保存配置中多出的字段忽略，
   * 缺失的字段取默认值。确保列定义变更后不会读到脏数据。
   */
  function loadFromPreference(): void {
    if (!persist) return;

    const saved = readFromStorage(tableId);
    if (!saved) {
      logger.info('无已保存的表格列配置，使用默认值，tableId: {}', tableId);
      return;
    }

    const validFields = new Set(columns.map((col) => col.field));

    // 过滤掉已失效的字段，补充缺失的字段
    const mergedVisible = [
      ...saved.visibleColumns.filter((f) => validFields.has(f)),
      ...defaults.visibleColumns.filter(
        (f) => !saved.visibleColumns.includes(f),
      ),
    ];

    const mergedOrder = [
      ...saved.columnOrder.filter((f) => validFields.has(f)),
      ...defaults.columnOrder.filter((f) => !saved.columnOrder.includes(f)),
    ];

    const mergedWidth: Record<string, number> = {};
    for (const col of columns) {
      const savedWidth = saved.columnWidth[col.field];
      if (savedWidth !== undefined) {
        mergedWidth[col.field] = savedWidth;
      } else if (col.width !== undefined) {
        mergedWidth[col.field] = col.width;
      }
    }

    visibleColumns.value = mergedVisible;
    columnOrder.value = mergedOrder;
    columnWidth.value = mergedWidth;

    logger.info('已恢复表格列配置，tableId: {}', tableId);
  }

  /**
   * 将当前状态持久化到 localStorage。
   */
  function saveToPreference(): void {
    if (!persist) return;

    const state: ColumnPreferenceState = {
      visibleColumns: [...visibleColumns.value],
      columnOrder: [...columnOrder.value],
      columnWidth: { ...columnWidth.value },
    };
    writeToStorage(tableId, state);
    logger.info('表格列配置已保存，tableId: {}', tableId);
  }

  /**
   * 重置为默认配置并清除持久化记录。
   */
  function resetToDefault(): void {
    visibleColumns.value = [...defaults.visibleColumns];
    columnOrder.value = [...defaults.columnOrder];
    columnWidth.value = { ...defaults.columnWidth };

    if (persist) {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tableId}`);
      } catch (error) {
        logger.warn('清除表格列配置失败', { tableId, error });
      }
    }

    logger.info('表格列配置已重置为默认值，tableId: {}', tableId);
  }

  function setColumnVisible(field: string, visible: boolean): void {
    if (visible && !visibleColumns.value.includes(field)) {
      visibleColumns.value = [...visibleColumns.value, field];
    } else if (!visible) {
      visibleColumns.value = visibleColumns.value.filter((f) => f !== field);
    }
  }

  function setColumnWidth(field: string, width: number): void {
    columnWidth.value = { ...columnWidth.value, [field]: width };
  }

  function setColumnOrder(order: string[]): void {
    columnOrder.value = [...order];
  }

  // 自动持久化：监听状态变更后 debounce 写入
  if (persist) {
    watch(
      [visibleColumns, columnOrder, columnWidth],
      () => {
        saveToPreference();
      },
      { deep: true },
    );
  }

  // 启动时尝试恢复
  if (persist) {
    loadFromPreference();
  }

  return {
    visibleColumns,
    columnOrder,
    columnWidth,
    saveToPreference,
    loadFromPreference,
    resetToDefault,
    setColumnVisible,
    setColumnWidth,
    setColumnOrder,
  };
}
