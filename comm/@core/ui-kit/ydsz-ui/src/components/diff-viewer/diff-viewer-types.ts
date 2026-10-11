/**
 * DiffViewer 文本对比组件类型定义。
 *
 * 提供分栏（split）/ 单栏（unified）两种 diff 视图模式，
 * 基于 LCS 算法按行比较文本差异。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\diff-viewer\diff-viewer-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** diff 视图模式 */
export type DiffViewMode = 'split' | 'unified';

/** 行操作类型 */
export type DiffOpType = 'add' | 'remove' | 'equal';

/** diff 行数据 */
export interface DiffLine {
  /** 行类型 */
  type: DiffOpType;
  /** 旧文本行号（equal / remove 时有值） */
  oldNumber: number | null;
  /** 新文本行号（equal / add 时有值） */
  newNumber: number | null;
  /** 行内容 */
  content: string;
}

/** diff chunk（上下文分组） */
export interface DiffChunk {
  /** chunk 内的行列表 */
  lines: DiffLine[];
  /** chunk 起始位置（旧文本行号） */
  oldStart: number;
  /** chunk 起始位置（新文本行号） */
  newStart: number;
}

/** DiffViewer 组件 Props */
export interface DiffViewerProps {
  class?: string;
  /** 旧文本 */
  oldValue: string;
  /** 新文本 */
  newValue: string;
  /** 对比模式：split（分栏） / unified（单栏） */
  mode?: DiffViewMode;
  /** 上下文行数 */
  contextSize?: number;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 旧文本标题（显示在 header） */
  oldTitle?: string;
  /** 新文本标题 */
  newTitle?: string;
  /** 每个 chunk 上方是否显示展开按钮 */
  expandable?: boolean;
}
