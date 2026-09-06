/**
 * composables 模块统一导出（barrel file）
 *
 * @path comm\effects\shared-business\src\composables\index.ts
 * @author ydsz-team
 * @since 1.2.0
 *
 * @remarks
 * 所有 composable 函数与类型的单一对外入口。
 * 子应用推荐从此路径导入，保持 import 语句稳定。
 */

// —— Excel 导入 / 导出 ——
export {
  useExcelExport,
  type ExcelColumn,
  type ExcelColumnDataType,
  type ExcelExportColumn,
  type ExcelExportParams,
  type ExcelExportProgressCallback,
  type ExcelExportCompleteCallback,
  type ExcelExportErrorCallback,
  type ExcelExportOptions,
} from './use-excel-export';

export {
  useExcelImport,
  type ExcelImportResult,
  type ImportError,
  type ExcelImportOptions,
} from './use-excel-import';

// —— 键盘快捷键 ——
export {
  useKeyboardShortcut,
  bindGlobalShortcut,
  clearScope,
  type ShortcutDescriptor,
} from './use-keyboard-shortcut';

// —— 服务端分页 ——
export {
  useServerPagination,
  type ServerPaginationFetcher,
  type ServerPaginationOptions,
} from './use-server-pagination';

// —— 通用 CRUD 列表 ——
export {
  useCrudTable,
  type CrudTableOptions,
  type DeleteFetcher,
} from './use-crud-table';

// —— 字典事件 ——
export {
  emitDictChange,
  onDictChange,
  type DictChangeEventDetail,
} from './use-dict-event';

// —— 多租户 ——
export {
  setTenantFetcher,
  useTenant,
  type TenantFetcher,
  type TenantInfo,
} from './use-tenant';

// —— 审批日志 ——
export {
  useAuditLog,
  type AuditLogFetcher,
  type AuditLogItem,
  type AuditLogQuery,
  type AuditLogPageResult,
} from './use-audit-log';

// —— 工作流设计器 ——
export {
  useFlowDesigner,
  type FlowCanvasControls,
  type FlowDesignerOptions,
  type FlowNode,
} from './use-flow-designer';

// —— 用户引导 ——
export {
  useAppTour,
  type AppTourOptions,
  type TourStep,
} from './use-app-tour';

// —— 响应式 ——
export {
  useResponsive,
  type ResponsiveColumn,
} from './use-responsive';
