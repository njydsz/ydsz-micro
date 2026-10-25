/**
 * YdProTable 增强 Props / 类型定义。
 *
 * 在既有 ProTableProps 基础上追加：
 *  - searchFields：自动生成搜索表单
 *  - editable：行内编辑
 *  - onCreate / createText：内置新增弹窗
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\pro-table-types.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { TableColumnDef } from '../../composables/use-table-data';

/** 搜索表单字段控件类型 */
export type SearchFieldControlType = 'text' | 'select' | 'date' | 'dateRange' | 'number';

/** 搜索表单字段配置 */
export interface SearchField {
  /** 字段 key */
  key: string;
  /** 标题 */
  label: string;
  /** 控件类型 */
  type?: SearchFieldControlType;
  /** select options */
  options?: { label: string; value: any }[];
  /** placeholder */
  placeholder?: string;
  /** 宽度 */
  width?: string | number;
}

/** 行内编辑回调配置 */
export interface EditableConfig {
  /** 行进入编辑模式 */
  onEdit?: (row: any, index: number) => void;
  /** 行保存（返回 true 则退出编辑态） */
  onSave?: (row: any, index: number) => Promise<boolean>;
  /** 行取消编辑 */
  onCancel?: (row: any, index: number) => void;
}

/** 分页配置 */
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
}

/** 行选择配置 */
export interface RowSelectionConfig {
  selectedKeys?: string[];
  type?: 'checkbox' | 'radio';
}

/** ProTable 全量 Props（基础 + 增强） */
export interface ProTableProps<T extends Record<string, unknown>> {
  /** 列定义（含排序/筛选配置） */
  columns: TableColumnDef<T>[];
  /** 数据源 */
  dataSource: T[];
  /** 行唯一 key 获取函数 */
  rowKey?: (row: T, index: number) => string;
  /** 加载状态 */
  isLoading?: boolean;
  /** 分页配置（传 null 则隐藏分页） */
  pagination?: PaginationConfig | null;
  /** 行选择配置（不传则不启用行选择） */
  rowSelection?: RowSelectionConfig;
  /** 是否远程模式（关闭本地排序/筛选） */
  isRemote?: boolean;
  /** 容器类名 */
  class?: string;
  /** 汇总行计算函数 */
  summary?: (data: T[]) => Record<string, string | number>;
  /** 搜索表单配置（自动生成搜索栏） */
  searchFields?: SearchField[];
  /** 搜索表单提交回调 */
  onSearch?: (values: Record<string, any>) => void;
  /** 是否启用行内编辑 */
  editable?: boolean | EditableConfig;
  /** 表单校验规则（透传 vee-validate） */
  formRules?: Record<string, any[]>;
  /** 新增按钮文字 */
  createText?: string;
  /** 新增回调（内置弹窗或外部 slot） */
  onCreate?: (values?: Record<string, any>) => void;
  /** 编辑按钮文字 */
  editText?: string;
  /** 删除按钮文字 */
  deleteText?: string;
  /** 是否允许多列排序（Shift + 点击表头追加到排序链） */
  multipleSort?: boolean;
  /** 是否启用行虚拟滚动（超大数据量，需配合 virtualHeight 限定可视区高度） */
  virtual?: boolean;
  /** 行虚拟滚动可视区高度（像素） */
  virtualHeight?: number;
  /** 导出默认文件名（不含扩展名） */
  exportFileName?: string;
}
