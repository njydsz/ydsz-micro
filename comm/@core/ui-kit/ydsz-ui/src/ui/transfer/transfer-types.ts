/**
 * Transfer 穿梭框组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/** 穿梭项 */
export interface TransferItem {
  /** 唯一键 */
  key: string | number;
  /** 显示标题 */
  title: string;
  /** 描述信息 */
  description?: string;
  /** 是否禁用 */
  isDisabled?: boolean;
}

/**
 * Transfer 组件属性。
 */
export interface TransferProps {
  /** 自定义 CSS class */
  class?: string;
  /** 数据源 */
  dataSource: TransferItem[];
  /** 已选中的键列表 */
  targetKeys: (string | number)[];
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否可搜索 */
  filterable?: boolean;
  /** 搜索占位符 */
  filterPlaceholder?: string;
  /** 左侧面板标题 */
  titles?: [string, string];
  /** 空数据提示文案 */
  notFoundContent?: string;
}

/**
 * Transfer 组件事件。
 */
export interface TransferEmits {
  /** targetKeys 变化回调 */
  (e: 'update:targetKeys', keys: (string | number)[]): void;
  /** 选项在面板间移动 */
  (e: 'change', targetKeys: (string | number)[], direction: 'left' | 'right', moveKeys: (string | number)[]): void;
}
