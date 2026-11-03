/**
 * useOrgChartCore —— YdOrgChart 的脚本核心逻辑。
 *
 * <p>集中管理组织架构图的节点扁平化、过滤、展开状态、单选 / 多选、
 * 节点样式与连接线样式。组件仅负责模板渲染，并保持原有 props、emits、
 * slots 和 expose 契约。
 *
 * @deprecated 请优先使用 YdOrganizationChart 与 useOrganizationChart。
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\use-org-chart-core.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { OrgChartEmits, OrgChartNode, OrgChartProps } from './org-chart-types';
import type { ComputedRef, Ref } from 'vue';

import { computed, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

/** useOrgChartCore 配置 */
export interface UseOrgChartCoreOptions {
  /** 组件 props（响应式） */
  props: OrgChartProps;
  /** 组件 emits 触发器 */
  emit: OrgChartEmits;
}

/** useOrgChartCore 返回句柄 */
export interface UseOrgChartCoreReturn {
  /** 当前过滤输入 */
  filterText: Ref<string>;
  /** 当前过滤后的可见节点 */
  filteredNodes: ComputedRef<OrgChartNode[]>;
  /** 连接线 Tailwind 样式 */
  connectorBorder: ComputedRef<string>;
  /** 节点是否展开 */
  isExpanded: (node: OrgChartNode) => boolean;
  /** 节点是否选中 */
  isSelected: (node: OrgChartNode) => boolean;
  /** 切换节点展开状态 */
  toggleExpand: (node: OrgChartNode) => void;
  /** 切换节点选择状态 */
  toggleSelect: (node: OrgChartNode) => void;
  /** 判断节点是否拥有子节点 */
  hasChildren: (node: OrgChartNode) => boolean;
  /** 获取节点卡片样式 */
  getNodeClasses: (node: OrgChartNode) => string;
}

/**
 * 将组织树展开为一维节点列表。
 *
 * @param nodes - 组织节点
 * @returns 展开后的节点列表
 */
export function flattenNodes(nodes: OrgChartNode[]): OrgChartNode[] {
  const result: OrgChartNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flattenNodes(node.children));
    }
  }
  return result;
}

/**
 * 判断节点是否拥有子节点。
 *
 * @param node - 组织节点
 * @returns 是否存在非空子节点
 */
export function hasChildren(node: OrgChartNode): boolean {
  return !!node.children && node.children.length > 0;
}

/**
 * 获取连接线 Tailwind 样式。
 *
 * @param connectorStyle - 连接线样式
 * @returns 对应的 Tailwind border class
 */
export function getConnectorBorderStyle(connectorStyle: OrgChartProps['connectorStyle']): string {
  switch (connectorStyle) {
    case 'dashed':
      return 'border-dashed';
    case 'dotted':
      return 'border-dotted';
    default:
      return 'border-solid';
  }
}

/**
 * 按字段和关键字递归过滤组织节点。
 *
 * @param nodes - 组织节点
 * @param keyword - 小写关键字
 * @param filterBy - 参与匹配的节点字段
 * @returns 保留匹配节点及其命中的祖先链
 */
export function filterTreeNodes(
  nodes: OrgChartNode[],
  keyword: string,
  filterBy: string,
): OrgChartNode[] {
  const result: OrgChartNode[] = [];
  for (const node of nodes) {
    const matchField = (node[filterBy as keyof OrgChartNode] ?? '').toString().toLowerCase();
    const selfMatch = matchField.includes(keyword);
    const matchedChildren = node.children ? filterTreeNodes(node.children, keyword, filterBy) : [];
    if (selfMatch || matchedChildren.length > 0) {
      result.push({
        ...node,
        children: matchedChildren.length > 0 ? matchedChildren : node.children,
      });
    }
  }
  return result;
}

/**
 * 装配 YdOrgChart 的状态与行为。
 *
 * @param options - props / emit
 * @returns 组织架构图核心句柄
 */
export function useOrgChartCore(options: UseOrgChartCoreOptions): UseOrgChartCoreReturn {
  const { emit, props } = options;
  const expandedSet = ref<Set<string | number>>(new Set());
  const selectedSet = ref<Set<string | number>>(new Set());
  const filterText = ref<string>('');

  /** 根据数据中的 expanded 标记初始化展开状态。 */
  function initExpanded(nodes: OrgChartNode[]): void {
    for (const node of nodes) {
      if (node.expanded !== false) {
        expandedSet.value.add(node.id);
      }
      if (node.children?.length) {
        initExpanded(node.children);
      }
    }
  }

  watch(
    () => props.value,
    (val) => {
      expandedSet.value = new Set();
      if (val) initExpanded(val);
    },
    { immediate: true },
  );

  watch(
    () => props.selection,
    (val) => {
      selectedSet.value = new Set();
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((node) => selectedSet.value.add(node.id));
      } else {
        selectedSet.value.add(val.id);
      }
    },
    { immediate: true },
  );

  const filteredNodes = computed(() => {
    if (!props.filter || !filterText.value.trim()) return props.value;
    return filterTreeNodes(props.value, filterText.value.trim().toLowerCase(), props.filterBy);
  });

  const connectorBorder = computed(() => getConnectorBorderStyle(props.connectorStyle));

  function isExpanded(node: OrgChartNode): boolean {
    return expandedSet.value.has(node.id);
  }

  function toggleExpand(node: OrgChartNode): void {
    if (!props.collapsible || !node.children?.length) return;
    if (expandedSet.value.has(node.id)) {
      expandedSet.value.delete(node.id);
      emit('node-collapse', node);
    } else {
      expandedSet.value.add(node.id);
      emit('node-expand', node);
    }
  }

  function isSelected(node: OrgChartNode): boolean {
    return selectedSet.value.has(node.id);
  }

  function toggleSelect(node: OrgChartNode): void {
    if (!props.selectionMode) return;
    if (props.selectionMode === 'single') {
      if (selectedSet.value.has(node.id)) {
        selectedSet.value = new Set();
        emit('update:selection', null);
        emit('node-unselect', node);
      } else {
        selectedSet.value = new Set([node.id]);
        emit('update:selection', node);
        emit('node-select', node);
      }
      return;
    }

    if (selectedSet.value.has(node.id)) {
      selectedSet.value.delete(node.id);
      emit('node-unselect', node);
    } else {
      selectedSet.value.add(node.id);
      emit('node-select', node);
    }
    const allSelected = flattenNodes(props.value).filter((item) => selectedSet.value.has(item.id));
    emit('update:selection', allSelected);
  }

  function getNodeClasses(node: OrgChartNode): string {
    const selected = isSelected(node);
    return cn(
      'border-primary/10 relative rounded-lg border-2 bg-white p-3 shadow-sm transition-all duration-200',
      'min-w-40',
      selected && 'border-primary ring-primary/20 ring-2',
      !selected && 'hover:border-primary/30 hover:bg-primary/5 hover:shadow-md',
      node.className,
    );
  }

  return {
    connectorBorder,
    filterText,
    filteredNodes,
    getNodeClasses,
    hasChildren,
    isExpanded,
    isSelected,
    toggleExpand,
    toggleSelect,
  };
}
