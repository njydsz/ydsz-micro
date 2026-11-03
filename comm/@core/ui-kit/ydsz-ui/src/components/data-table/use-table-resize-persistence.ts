/**
 * useTableResizePersistence composable —— 列宽拖拽状态与持久化。
 *
 * <p>从 YdDataTable.vue 提取：封装列宽持久化（localStorage）与拖拽事件绑定，
 * 减少主组件体积。统一走 useTableColumnStorage，无 storageKey 时降级旧 key。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-resize-persistence.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { onScopeDispose } from 'vue';

import { useTableColumnStorage } from '../../composables/use-table-column-storage';
import { useColumnResize } from '../table/useColumnResize';

/** 旧 fallback 存储 key */
const RESIZE_STORAGE_KEY = 'yd-datatable-col-widths';

/**
 * 列宽拖拽状态与持久化。
 *
 * @param storageKey - 列配置持久化 key；传入则启用 localStorage 持久化
 * @returns 列宽 API + 事件处理函数
 */
export function useTableResizePersistence(storageKey?: string) {
  const columnStorage = storageKey ? useTableColumnStorage(storageKey) : null;

  /**
   * 读取持久化列宽（localStorage 不可用或数据损坏时返回空表）。
   */
  function loadPersistedWidths(): Record<string, number> {
    if (columnStorage) {
      const configs = columnStorage.loadColumnConfig();
      const result: Record<string, number> = {};
      for (const cfg of configs) {
        if (cfg.width) {
          const parsed = Number.parseInt(cfg.width, 10);
          if (!Number.isNaN(parsed))
            result[cfg.key] = parsed;
        }
      }
      return result;
    }
    try {
      const raw = localStorage.getItem(RESIZE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * 写回持久化列宽。
   */
  function persistWidths(widths: Record<string, number>): void {
    if (columnStorage) {
      const existing = columnStorage.loadColumnConfig();
      const existingMap = new Map(existing.map(c => [c.key, c]));
      const merged = Object.entries(widths).map(([key, width]) => {
        const prev = existingMap.get(key);
        return {
          fixed: prev?.fixed,
          isHidden: prev?.isHidden,
          key,
          sort: prev?.sort,
          width: String(width),
        };
      });
      for (const cfg of existing) {
        if (!widths[cfg.key])
          merged.push(cfg);
      }
      columnStorage.saveColumnConfig(merged);
      return;
    }
    try {
      localStorage.setItem(RESIZE_STORAGE_KEY, JSON.stringify(widths));
    } catch {
      // 隐私模式 / 配额溢出时静默降级，不影响拖拽本身
    }
  }

  const columnResizeApi = useColumnResize({
    defaultMinWidth: 60,
    initialWidths: loadPersistedWidths(),
  });

  /** 列宽拖拽的 document 监听句柄 */
  let resizeMoveHandler: ((event: PointerEvent) => void) | null = null;
  let resizeUpHandler: (() => void) | null = null;

  /** 回收列宽拖拽的 document 监听 */
  function detachResizeListeners(): void {
    if (resizeMoveHandler) document.removeEventListener('pointermove', resizeMoveHandler);
    if (resizeUpHandler) document.removeEventListener('pointerup', resizeUpHandler);
    resizeMoveHandler = null;
    resizeUpHandler = null;
  }

  /**
   * 开始列宽拖拽，并在 pointerup 时回收 document 监听。
   */
  function handleResizeStart(
    columnKey: string,
    event: PointerEvent,
    onResize?: (columnKey: string, newWidth: number) => void,
  ): void {
    columnResizeApi.onResizeStart(columnKey, event);

    resizeMoveHandler = (moveEvent: PointerEvent) => {
      columnResizeApi.onResizeMove(moveEvent);
      persistWidths({ ...columnResizeApi.columnWidths.value });
      onResize?.(columnKey, columnResizeApi.columnWidths.value[columnKey] ?? 0);
    };
    resizeUpHandler = () => {
      columnResizeApi.onResizeEnd();
      detachResizeListeners();
    };
    document.addEventListener('pointermove', resizeMoveHandler);
    document.addEventListener('pointerup', resizeUpHandler, { once: true });
  }

  onScopeDispose(detachResizeListeners);

  return {
    columnResizeApi,
    detachResizeListeners,
    handleResizeStart,
    loadPersistedWidths,
    persistWidths,
  };
}
