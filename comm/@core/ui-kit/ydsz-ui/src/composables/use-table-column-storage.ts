/**
 * useTableColumnStorage —— 表格列配置持久化 composable。
 *
 * <p>将列的显隐、宽度、固定位置和拖拽顺序保存到 localStorage，
 * 下次打开页面时自动恢复用户上次配置。
 *
 * <p>设计要点：
 * <ul>
 *   <li>KV 结构简单可序列化：key 由调用方指定，避免不同表格互相覆盖</li>
 *   <li>版本号支持 schema 迁移：当列定义结构升级时触发版本检查</li>
 *   <li>容错静默：JSON 解析失败时返回空对象不阻断渲染</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const { saveColumnConfig, loadColumnConfig } = useTableColumnStorage('user-list-table');
 *   // 列变更时调用 save
 *   watch(cols, (v) => saveColumnConfig(v));
 *   // 初始化时恢复
 *   const initialCols = mergeColumns(defaults, loadColumnConfig());
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-column-storage.ts
 * @author ydsz-team
 * @since 26.09.17
 */

/** 存储的列配置摘要 */
export interface StoredColumnConfig {
  /** 列标识（prop 或 id） */
  key: string;
  /** 是否隐藏 */
  isHidden?: boolean;
  /** 覆写的宽度（CSS width） */
  width?: string;
  /** 排序权重（数值越小越靠前） */
  sort?: number;
  /** 固定位置 */
  fixed?: 'left' | 'right';
}

/** localStorage 中存储的完整结构 */
interface StoragePayload {
  /** 结构版本号，未来 schema 变更时递增 */
  version: number;
  /** 各列配置数组 */
  columns: StoredColumnConfig[];
}

/** 当前存储版本 */
const CURRENT_VERSION = 1;

/** 统一前缀 */
const STORAGE_PREFIX = 'yd:table:col:';

/**
 * useTableColumnStorage：表格列配置持久化管理。
 *
 * @param tableKey - 表格唯一标识（建议用路由 name + 模块名）
 * @return 持久化操作 API
 */
export function useTableColumnStorage(tableKey: string) {
  const storageKey = `${STORAGE_PREFIX}${tableKey}`;

  /**
   * 从 localStorage 读取原始字符串。
   *
   * @return 原始字符串或 null
   */
  function readRaw(): string | null {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      // localStorage 不可用时静默降级
      return null;
    }
  }

  /**
   * 解析存储 payload 并进行版本校验。
   *
   * @return 解析成功返回 payload，否则返回 null
   */
  function parsePayload(): StoragePayload | null {
    const raw = readRaw();
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as StoragePayload;
      // 结构版本不匹配则认为已过期，返回 null
      if (parsed.version !== CURRENT_VERSION) {
        return null;
      }
      if (!Array.isArray(parsed.columns)) {
        return null;
      }
      return parsed;
    } catch {
      // JSON 格式化失败时降级返回 null
      return null;
    }
  }

  /**
   * 加载列配置数组。
   *
   * @return 存储的列配置数组；无存储或解析失败返回空数组
   */
  function loadColumnConfig(): StoredColumnConfig[] {
    return parsePayload()?.columns ?? [];
  }

  /**
   * 持久化列配置到 localStorage。
   *
   * @param columns - 当前列配置数组
   */
  function saveColumnConfig(columns: StoredColumnConfig[]): void {
    const payload: StoragePayload = {
      columns,
      version: CURRENT_VERSION,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // quota exceeded 等写入失败时静默降级
    }
  }

  /**
   * 清除当前表格的列配置存储。
   */
  function clearColumnConfig(): void {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  return {
    clearColumnConfig,
    loadColumnConfig,
    saveColumnConfig,
  };
}
