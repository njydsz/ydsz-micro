/**
 * YdOrgChart 组织架构图数据契约与 Props / Emits 定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\org-chart-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export interface OrgChartNode {
  id: string | number;
  label: string;
  type?: string;
  expanded?: boolean;
  children?: OrgChartNode[];
  data?: Record<string, any>;
  icon?: string;
  image?: string;
  className?: string;
}

export interface OrgChartProps {
  value: OrgChartNode[];
  class?: any;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 选择模式 */
  selectionMode?: 'single' | 'multiple';
  /** 当前选中节点 */
  selection?: OrgChartNode | OrgChartNode[] | null;
  /** 横向树（默认 false 纵向） */
  horizontal?: boolean;
  /** 连接线样式 */
  connectorStyle?: 'solid' | 'dashed' | 'dotted';
  /** 过滤 */
  filter?: boolean;
  /** 过滤字段 */
  filterBy?: string;
}

export interface OrgChartEmits {
  (e: 'update:selection', node: OrgChartNode | OrgChartNode[] | null): void;
  (e: 'node-select', node: OrgChartNode): void;
  (e: 'node-unselect', node: OrgChartNode): void;
  (e: 'node-expand', node: OrgChartNode): void;
  (e: 'node-collapse', node: OrgChartNode): void;
}
