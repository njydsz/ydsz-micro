/**
 * ydsz-ui 组合式函数出口。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { getRenderPerfSnapshot, resetRenderPerformance, useRenderPerformance } from './use-render-performance';
export type { UseRenderPerformanceOptions } from './use-render-performance';

export { useIdleHydrate, useSimpleIdleHydrate } from './use-idle-hydrate';
export type { IdleHydrateHandle, UseIdleHydrateOptions } from './use-idle-hydrate';

export { useChunkUpload, DEFAULT_CHUNK_SIZE, DEFAULT_MULTIPART_BASE, DEFAULT_MAX_RETRIES, DEFAULT_CHUNK_TIMEOUT } from './use-chunk-upload';
export type {
  ChunkUploadHandle,
  ChunkUploadOptions,
  ChunkInfo,
  ChunkHttpRequestOptions,
  MultipartApiConfig,
  MultipartInitResponse,
  MultipartCompleteResponse,
} from './use-chunk-upload';

export { useVirtualList } from './use-virtual-list';
export type {
  UseVirtualListOptions,
  VirtualListHandle,
  VisibleItem,
} from './use-virtual-list';

export { useColumnDrag } from './use-column-drag';
export type { ColumnDragState, UseColumnDragOptions } from './use-column-drag';

export { useTableColumnStorage } from './use-table-column-storage';
export type { StoredColumnConfig } from './use-table-column-storage';

export { useTableFilterStorage } from './use-table-filter-storage';
export type {
  UseTableFilterStorageOptions,
  UseTableFilterStorageReturn,
} from './use-table-filter-storage';

export { useTreeVirtual } from './use-tree-virtual';
export type {
  FlatTreeNode,
  LazyLoadContext,
  UseTreeVirtualOptions,
  TreeVirtualHandle,
  VirtualTreeNode,
} from './use-tree-virtual';

export { useDragSort } from './use-drag-sort';
export type {
  DragSortDirection,
  DragSortState,
  UseDragSortOptions,
  ReorderPayload,
} from './use-drag-sort';

export { useComponentI18n } from './use-component-i18n';
export type {
  UseComponentI18nOptions,
  ComponentI18nHandle,
} from './use-component-i18n';

export { useTableData } from './use-table-data';
export type {
  TableColumnDef,
  SortState,
  RowSelectionConfig,
  UseTableDataOptions,
  UseTableDataReturn,
} from './use-table-data';

export { useNotificationHub } from './use-notification-hub';
export type {
  NotificationItem,
  NotificationLevel,
  NotificationPlacement,
  NotificationPreferences,
  UseNotificationHubOptions,
  UseNotificationHubReturn,
} from './use-notification-hub';

export { useGridContext, useGridItem, useGridProvider, GRID_CONTEXT_KEY } from './use-grid-layout';
export type {
  GridBreakpoint,
  GridBreakpoints,
  GridColumnConfig,
  GridItemConfig,
  GridContext,
  UseGridProviderOptions,
} from './use-grid-layout';

export { useOverlayStack } from './use-overlay-stack';
export type { OverlayStackHandle } from './use-overlay-stack';

export { useFormDraft } from './use-form-draft';
export type {
  UseFormDraftOptions,
  UseFormDraftReturn,
} from './use-form-draft';

export { useTheme, initTheme } from './use-theme';
export type { ThemeMode } from './use-theme';

// 从旧 @core/composables 迁移的横向能力 composables（唯一入口收敛）
export {
  useCrossTabState,
  useCrossTabEvent,
  broadcastCrossTabEvent,
} from './use-cross-tab-state';

export {
  usePriorityValue,
  usePriorityValues,
  useForwardPriorityValues,
} from './use-priority-value';

export {
  createStorageKey,
  readStorageItem,
  writeStorageItem,
  removeStorageItem,
} from './utils';

export { useSortable } from './use-sortable';
export type { Sortable } from './use-sortable';
