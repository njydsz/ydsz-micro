/**
 * ColumnChooser / useColumnChooser 的 TypeScript 类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\column-chooser-types.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import type { ComputedRef, Ref } from 'vue';

/** 列可见性状态项 */
export interface ColumnVisibilityState {
  /** 列 key */
  key: string;
  /** 列标签 */
  label: string;
  /** 当前是否可见 */
  visible: boolean;
  /** 是否允许隐藏（always-visible 列如 selection/operation 返回 false） */
  hideable: boolean;
}

/** useColumnChooser 配置 */
export interface UseColumnChooserOptions {
  /** 完整列定义（含 key/label/hideable） */
  allColumns: () => Array<{ key: string; label: string; hideable?: boolean }>;
  /** 受控可见性状态（可选，传则用受控模式） */
  controlledVisibility?: Ref<Record<string, boolean> | undefined>;
}

/** useColumnChooser 返回值 */
export interface UseColumnChooserReturn {
  /** 全部列状态列表（含 label/visible/hideable） */
  states: ComputedRef<ColumnVisibilityState[]>;
  /** 当前可见列 keys */
  visibleKeys: ComputedRef<string[]>;
  /** 是否所有 hideable 列都可见 */
  allVisible: ComputedRef<boolean>;
  /** 是否部分 hideable 列可见（不全满也不全空） */
  someVisible: ComputedRef<boolean>;
  /** 切换单列 visibility */
  toggle: (key: string) => void;
  /** 设置指定列可见性 */
  setVisible: (key: string, visible: boolean) => void;
  /** 全选（将所有 hideable 列设为可见） */
  showAll: () => void;
  /** 全不选（将所有 hideable 列设为隐藏） */
  hideAll: () => void;
  /** 重置为初始状态（全部可见） */
  reset: () => void;
  /** 应用新的可见性 map（批量） */
  apply: (visibility: Record<string, boolean>) => void;
}
