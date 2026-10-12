/**
 * Collapse 折叠面板组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/** 折叠面板项数据 */
export interface CollapseItem {
  /** 唯一 key */
  key: string;
  /** 标题 */
  title: string;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 额外属性 */
  extra?: string;
}

/**
 * Collapse 组件属性。
 */
export interface CollapseProps {
  /** 自定义 CSS class */
  class?: string;
  /** 面板数据 */
  items: CollapseItem[];
  /** 是否手风琴模式（同时只展开一个） */
  accordion?: boolean;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 展开图标位置 */
  expandIconPosition?: 'start' | 'end';
  /** 是否显示边框 */
  bordered?: boolean;
  /** 展开的面板 keys */
  activeKeys?: string[];
}

/**
 * Collapse 组件事件。
 */
export interface CollapseEmits {
  /** 展开面板变化 */
  (e: 'update:activeKeys', keys: string[]): void;
  /** 面板展开/折叠 */
  (e: 'change', keys: string[]): void;
}
