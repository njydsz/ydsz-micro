/**
 * useOrganizationChart —— 组织架构图的逻辑层 composable。
 *
 * <p>对标 PrimeVue OrganizationChart。负责：
 * <ul>
 *   <li>管理节点的展开/折叠状态</li>
 *   <li>管理单选/多选选中状态</li>
 *   <li>提供节点遍历工具函数</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const root = ref&lt;OrgNode&gt;({ id: '1', label: '总部', children: [...] });
 *   const { selected, toggleExpand, toggleSelect } = useOrganizationChart(root, {
 *     selectionMode: 'single',
 *   });
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\organization-chart\use-organization-chart.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import type { Ref } from 'vue';

import { computed, ref, toValue, type MaybeRef } from 'vue';

/** 节点基础标识 */
export interface OrgNodeKey {
  /** 唯一标识 */
  id: string;
  /** 父节点 ID（根节点为 null 或 undefined） */
  parentId?: string | null;
}

/** 组织架构图节点 */
export interface OrgNode extends OrgNodeKey {
  /** 显示文本 */
  label?: string;
  /**
   * 节点类型：root（根节点）、branch（分支）、leaf（叶子）。
   * 不传时根据位置推导：无父为根、无子为叶、其余为分支。
   */
  type?: 'root' | 'branch' | 'leaf';
  /** 节点容器的额外 CSS 类名 */
  className?: string;
  /** 是否展开子节点（仅对 branched 节点有效）
   * @default true
   */
  expanded?: boolean;
  /** 子节点列表 */
  children?: OrgNode[];
  /** 业务扩展数据（任意 KV 对） */
  data?: Record<string, unknown>;
}

/** 组织架构图配置项 */
export interface OrgChartOptions {
  /** 是否水平布局（默认垂直自上而下）
   * @default false
   */
  horizontal?: boolean;
  /** 是否允许折叠（默认 true）
   * @default true
   */
  collapsible?: boolean;
  /** 选择模式：single / multiple / null（禁用选择）
   * @default null
   */
  selectionMode?: 'single' | 'multiple' | null;
  /**
   * 自定义节点渲染模板。
   *
   * <p>接收节点数据，返回渲染节点的 VNode。
   * 不传时使用默认样式渲染。
   */
  template?: (node: OrgNode) => unknown;
}

/** useOrganizationChart 返回的句柄 */
export interface UseOrganizationChartReturn {
  /** 当前选中的节点列表 */
  selected: Ref<OrgNode[]>;
  /** 切换指定节点的选中状态 */
  toggleSelect: (id: string) => void;
  /** 判断指定节点是否已选中 */
  isSelected: (id: string) => boolean;
  /** 切换指定节点的展开/折叠状态（仅对 branched 节点有效） */
  toggleExpand: (id: string) => void;
  /** 判断指定节点是否已展开 */
  isExpanded: (id: string) => boolean;
  /** 递归查找节点（含完整路径） */
  findNode: (id: string) => OrgNode | null;
  /** 扁平化所有可见节点（按渲染顺序，适用于虚拟滚动） */
  visibleNodes: Ref<OrgNode[]>;
}

/**
 * 判断节点是否为"分支"（有子节点可展开/折叠）。
 *
 * @param node 节点
 * @returns 是否可展开
 */
export function isBranchNode(node: OrgNode): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}

/**
 * 推导节点类型：未提供 type 时根据位置解析。
 *
 * @param node 节点
 * @returns 推导后的类型
 */
export function resolveNodeType(node: OrgNode): 'root' | 'branch' | 'leaf' {
  if (node.type) {
    return node.type;
  }
  if (isBranchNode(node)) {
    return 'branch';
  }
  return 'leaf';
}

/**
 * 深度优先遍历节点树，收集所有可见节点（排除已折叠的子树）。
 *
 * @param nodes 节点数组
 * @param expandedSet 已展开节点 ID 集合
 * @returns 按 DFS 顺序排列的可见节点
 */
function collectVisibleNodes(
  nodes: readonly OrgNode[],
  expandedSet: ReadonlySet<string>,
): OrgNode[] {
  const result: OrgNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (isBranchNode(node) && expandedSet.has(node.id)) {
      const children = node.children ?? [];
      result.push(...collectVisibleNodes(children, expandedSet));
    }
  }
  return result;
}

/**
 * 在节点树中递归查找指定 ID 的节点。
 *
 * @param nodes 节点数组（搜索起点）
 * @param id 目标 ID
 * @returns 命中的节点，未找到返回 null
 */
function findInNodes(
  nodes: readonly OrgNode[],
  id: string,
): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findInNodes(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 组织架构图逻辑 composable。
 *
 * @param rootNode 根节点数据（响应式引用或字面量）
 * @param options 配置项
 * @returns 操作句柄
 *
 * @example
 * ```ts
 * const root = ref<OrgNode>({
 *   id: 'ceo',
 *   label: 'CEO',
 *   children: [
 *     { id: 'cto', label: 'CTO' },
 *     { id: 'cfo', label: 'CFO' },
 *   ],
 * });
 * const { selected, toggleExpand } = useOrganizationChart(root, {
 *   selectionMode: 'single',
 * });
 * ```
 */
export function useOrganizationChart(
  rootNode: MaybeRef<OrgNode>,
  options?: OrgChartOptions,
): UseOrganizationChartReturn {
  const {
    collapsible = true,
    selectionMode = null,
  } = options ?? {};

  // 未启用的扩展点保留在 OrgChartOptions 接口中供未来实现：
  // - template：自定义节点渲染
  // - horizontal：水平布局
  // 不在解构中引入未使用的变量，保持代码整洁与 tree-shaking 友好

  /** 当前选中的节点列表 */
  const selected = ref<OrgNode[]>([]);

  /** 已展开节点的 ID 集合（reactive） */
  const expandedSet = ref<Set<string>>(new Set());

  /**
   * 获取根节点数组（若根是数组则直接用，否则包装为数组）。
   *
   * @returns 根层节点数组
   */
  function getRootNodes(): OrgNode[] {
    const root = toValue(rootNode);
    return [root];
  }

  /** 扁平化所有可见节点 */
  const visibleNodes = computed<OrgNode[]>(() =>
    collectVisibleNodes(getRootNodes(), expandedSet.value),
  );

  /**
   * 初始化默认展开：收集所有 branched 节点的 ID。
   *
   * <p>仅在首次读取时执行，后续由 toggleExpand 控制。
   */
  function initExpandedState(nodes: readonly OrgNode[]): void {
    for (const node of nodes) {
      if (isBranchNode(node) && node.expanded !== false) {
        expandedSet.value.add(node.id);
      }
      if (node.children) {
        initExpandedState(node.children);
      }
    }
  }

  // 一次性初始化
  initExpandedState(getRootNodes());

  /**
   * 切换指定节点的展开/折叠状态。
   *
   * @param id 节点 ID
   */
  function toggleExpand(id: string): void {
    if (!collapsible) {
      return;
    }
    const newSet = new Set(expandedSet.value);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    expandedSet.value = newSet;
  }

  /**
   * 切换指定节点的选中状态。
   *
   * <p>selectionMode 为 null 时不执行任何操作。
   *
   * @param id 节点 ID
   */
  function toggleSelect(id: string): void {
    if (selectionMode === null) {
      return;
    }
    const node = findInNodes(getRootNodes(), id);
    if (!node) {
      return;
    }

    if (selectionMode === 'single') {
      // 单选：同一节点再次点击则取消
      if (selected.value.length === 1 && selected.value[0]?.id === id) {
        selected.value = [];
      } else {
        selected.value = [node];
      }
    } else {
      // 多选：追加或移除
      const idx = selected.value.findIndex((n) => n.id === id);
      if (idx >= 0) {
        selected.value = selected.value.filter((n) => n.id !== id);
      } else {
        selected.value = [...selected.value, node];
      }
    }
  }

  /**
   * 查找指定 ID 的节点。
   *
   * @param id 目标 ID
   * @returns 命中的节点；未找到返回 null
   */
  function findNode(id: string): OrgNode | null {
    return findInNodes(getRootNodes(), id);
  }

  /**
   * 判断指定节点是否已展开。
   *
   * @param id 节点 ID
   * @returns 是否展开
   */
  function isExpanded(id: string): boolean {
    return expandedSet.value.has(id);
  }

  /**
   * 判断指定节点是否已选中。
   *
   * @param id 节点 ID
   * @returns 是否选中
   */
  function isSelected(id: string): boolean {
    return selected.value.some((n) => n.id === id);
  }

  return {
    findNode,
    isExpanded,
    isSelected,
    selected,
    toggleExpand,
    toggleSelect,
    visibleNodes,
  };
}
