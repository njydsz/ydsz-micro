/**
 * advanced-table 组合式 API 统一出口。
 *
 * @path comm\@core\ui-kit\advanced-table\src\composables\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { useInlineEdit } from './use-inline-edit';
export { useCellEditor, injectCellEditor } from './use-cell-editor';
export { useRowExpand } from './use-row-expand';
export type { RowExpandOptions } from './use-row-expand';
export type {
  CellEditorState,
  EditorType,
  UseCellEditorOptions,
  UseCellEditorReturn,
  YDSZ_INLINE_EDIT_KEY,
} from './use-cell-editor';
