/**
 * YdTree 业务树组件的类型契约。
 *
 * 对标 Naive UI 的 Tree 组件，在 ydz-vue 的无头 Tree 根基之上增加：
 * - 懒加载（async loadData）
 * - 连接线（showLine）
 * - 展开状态持久化（expandedStorageKey）
 * - 关键字搜索高亮（searchValue / filterMethod）
 * - 节点图标（icon）
 * - 拖拽排序钩子（onDragStart / onDragEnd）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree\tree-types.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { Component } from 'vue';

/** 数据节点的基础结构 */
export interface TreeNodeData {
  /**
   * 节点唯一键。
   *
   * 当 getKey 未传入时，以此字段作为节点的唯一标识。
   */
  key?: string | number;
  /** 节点显示标题 */
  title?: string;
  /** 子节点数组 */
  children?: TreeNodeData[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否勾选框禁用 */
  checkboxDisabled?: boolean;
  /** 是否为叶子节点（用于懒加载判定：true 时不触发 loadData） */
  isLeaf?: boolean;
  /** 是否异步加载中的 loading 状态（通常由组件内部维护） */
  loading?: boolean;
  /** 是否可选中 */
  selectable?: boolean;
  /** 自定义图标 */
  icon?: Component | string;
  /** 自定义 Swatch 类名（注入到节点根元素） */
  class?: string;
  /** 业务扩展字段（显式保留 unknown 而非索引签名，避免 Vue 3 defineProps 推断问题） */
  [key: string]: string | number | boolean | Component | TreeNodeData[] | undefined;
}

/** 搜索过滤结果：节点匹配状态 */
export interface TreeFilterMatch {
  node: TreeNodeData;
  /** 节点自身是否命中搜索 */
  selfMatched: boolean;
  /** 父节点是否命中（命中时子节点需一并展示） */
  parentMatched: boolean;
  /** 子树中是否有任意命中 */
  descendantMatched: boolean;
}

/**
 * 节点展开/折叠控制形态。
 *
 * - 'click'：点击整行切换
 * - 'arrow': 仅点击箭头切换
 * - 'double': 双击展开/折叠
 */
export type TreeExpandTrigger = 'arrow' | 'click' | 'double';

/** YdTree 组件属性 */
export interface YdTreeProps {
  /**
   * 树形数据源。
   *
   * 每个节点建议通过 `key` 字段提供唯一标识；如未提供，会用内置路径 hash。
   */
  data?: TreeNodeData[];
  /**
   * 受控勾选值。
   *
   * 启用 checkable 后可用 `v-model:checkedKeys` 双向绑定。
   */
  checkedKeys?: (string | number)[];
  /**
   * 受控展开键。
   *
   * 默认展开所有节点；如需收起请显式传空数组。
   */
  expandedKeys?: (string | number)[];
  /**
   * 受控选中键（单选场景）。
   */
  selectedKeys?: (string | number)[];
  /**
   * 启用勾选框。
   *
   * 开启后节点前渲染 Checkbox，父子级联动由 `checkStrictly` 控制。
   * @default false
   */
  checkable?: boolean;
  /**
   * 勾选关联模式。
   *
   * - false（默认）：父子级联动，勾选父节点同步全选/取消子节点。
   * - true：父节点勾选与子节点独立。
   */
  checkStrictly?: boolean;
  /**
   * 是否多选。
   *
   * @default true（勾选框场景）/ false（单选场景）
   */
  multiple?: boolean;
  /**
   * 异步加载子节点的回调。
   *
   * 当展开的节点 `isLeaf=false` 且 `children` 为空（或 undefined）时被调用。
   * 回调入参为当前节点数据；应返回子节点数组或 Promise。
   */
  loadData?: (node: TreeNodeData) => Promise<TreeNodeData[]> | TreeNodeData[];
  /**
   * 是否显示层级连接线。
   *
   * Naive UI 风格的垂直缩进线，引导视觉层级。
   * @default false
   */
  showLine?: boolean;
  /**
   * 展开/折叠触发方式。
   *
   * @default 'click'
   */
  expandTrigger?: TreeExpandTrigger;
  /**
   * 展开状态的 localStorage 键名。
   *
   * 设置后，树会自动读取/写入展开状态；键名建议使用模块前缀避免冲突。
   * @default undefined（不持久化）
   */
  expandedStorageKey?: string;
  /**
   * 搜索关键字。
   *
   * 传入后通过 `filterMethod` 过滤节点；命中节点的title会高亮。
   */
  searchValue?: string;
  /**
   * 节点是否命中的过滤方法。
   *
   * 接收节点数据和搜索关键字，返回 true 表示命中。当搜索关键字为空时不过滤。
   * @default 默认用 title 包含匹配（不区分大小写）
   */
  filterMethod?: (node: TreeNodeData, keyword: string) => boolean;
  /**
   * 自定义唯一键提取函数。
   *
   * 优先级高于 `data[].key`。传入时严格以函数返回值去重与作为 v-model 绑定值。
   * @default (node) => node.key
   */
  getKey?: (node: TreeNodeData) => string | number;
  /**
   * 节点不可见时是否取消勾选（虚拟滚动联动）。
   *
   * 仅在启用虚拟滚动时生效。
   * @default false
   */
  cancelable?: boolean;
  /**
   * 虚拟滚动阈值。
   *
   * 节点总数超过此值时自动启用虚拟滚动以保障大数据性能。
   * @default 500
   */
  virtualScrollThreshold?: number;
  /**
   * 节点高度（px）。
   *
   * 用于虚拟滚动计算。
   * @default 32
   */
  itemHeight?: number;
  /**
   * 默认展开全部节点。
   *
   * @default false
   */
  defaultExpandAll?: boolean;
  /**
   * 自定义类名。
   */
  class?: string;
}

/**
 * YdTree 组件事件。
 */
export interface YdTreeEmits {
  /** 勾选键变化 */
  (e: 'update:checkedKeys', keys: (string | number)[]): void;
  /** 展开键变化 */
  (e: 'update:expandedKeys', keys: (string | number)[]): void;
  /** 选中键变化 */
  (e: 'update:selectedKeys', keys: (string | number)[]): void;
  /** 异步加载完成 */
  (e: 'load', node: TreeNodeData): void;
  /** 节点点击 */
  (e: 'click', node: TreeNodeData, event: MouseEvent): void;
  /** 节点展开 */
  (e: 'expand', node: TreeNodeData): void;
  /** 节点折叠 */
  (e: 'collapse', node: TreeNodeData): void;
  /** 节点拖拽开始（需外部拖拽库对接） */
  (e: 'dragStart', node: TreeNodeData, event: DragEvent): void;
  /** 节点拖拽结束 */
  (e: 'dragEnd', node: TreeNodeData, event: DragEvent): void;
}
